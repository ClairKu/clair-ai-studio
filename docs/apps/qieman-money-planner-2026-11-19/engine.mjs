export const ENGINE_VERSION = '1.0.0';
export class InputError extends Error {}

function number(value, label, min = 0, max = 1e12) {
  if (value === '' || value === null || value === undefined || typeof value === 'boolean') throw new InputError(`请填写${label}`);
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new InputError(`${label}须在${min}至${max}之间`);
  return n;
}
function civilDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputError(`请填写有效的${label}`);
  const time = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new InputError(`${label}不是有效日期`);
  return time;
}

export function computeGoal(input) {
  const todayAmount = number(input.todayAmount, '目标的今天金额', 0, 1e11);
  const years = number(input.years, '目标年数', 1, 80);
  if (!Number.isInteger(years)) throw new InputError('目标年数须为整数');
  const inflation = number(input.inflation, '通胀假设', -0.99, 1);
  const annualReturn = number(input.annualReturn, '收益假设', -0.99, 1);
  const initialCapital = number(input.initialCapital, '现有专用本金', 0, 1e12);
  const timing = input.timing;
  if (!['year-end', 'year-start', 'month-end'].includes(timing)) throw new InputError('请选择投入时点');
  const frequency = timing === 'month-end' ? 12 : 1;
  const periods = years * frequency;
  const rate = Math.expm1(Math.log1p(annualReturn) / frequency);
  const growthFactor = Math.exp(years * Math.log1p(annualReturn));
  const futureTarget = todayAmount * Math.exp(years * Math.log1p(inflation));
  const futureCapital = initialCapital * growthFactor;
  const gap = Math.max(0, futureTarget - futureCapital);
  let factor = Math.abs(rate) < 1e-12 ? periods : Math.expm1(periods * Math.log1p(rate)) / rate;
  if (timing === 'year-start') factor *= 1 + rate;
  const periodicContribution = gap / factor;
  if (![futureTarget, futureCapital, factor, periodicContribution].every(Number.isFinite) || factor <= 0) throw new InputError('参数组合超出可计算范围');
  return {todayAmount, years, inflation, annualReturn, initialCapital, timing, frequency, periods, rate, futureTarget, futureCapital, gap, annuityFactor: factor, periodicContribution};
}

export function computePlan(input) {
  if (!input || typeof input !== 'object') throw new InputError('方案数据无效');
  const name = String(input.name || '未命名方案').trim().slice(0, 80);
  const snapshot = input.snapshot;
  const snapshotTime = civilDate(snapshot, '资料日期');
  const total = number(input.total, '可安排金融资产');
  const monthlyEssential = number(input.monthlyEssential, '每月必要支出');
  const reserveMonths = number(input.reserveMonths, '备用月数', 0, 120);
  const horizonYears = number(input.horizonYears, '剩余资金可持有年数', 0, 80);
  const reserve = monthlyEssential * reserveMonths;
  if (!Array.isArray(input.needs) || input.needs.length > 50) throw new InputError('近期支出数据无效，最多支持50项');
  const needs = input.needs.map((item, i) => {
    if (!item || typeof item !== 'object') throw new InputError(`第${i + 1}项支出数据无效`);
    const amount = number(item.amount, `第${i + 1}项支出金额`);
    const dueTime = civilDate(item.date, `第${i + 1}项支出日期`);
    if (dueTime < snapshotTime) throw new InputError(`第${i + 1}项支出日期早于资料日期`);
    return {name: String(item.name || `支出${i + 1}`).trim().slice(0, 80), amount, date: item.date, days: Math.round((dueTime - snapshotTime) / 86400000)};
  }).sort((a,b) => a.date.localeCompare(b.date));
  const earmarked = needs.reduce((sum, item) => sum + item.amount, 0);
  const remainder = total - reserve - earmarked;
  const fundingGap = Math.max(0, -remainder);
  const available = Math.max(0, remainder);
  const warnings = [];
  if (fundingGap > 0) warnings.push('现有资产不足以同时满足备用金与支出预留，先解决资金缺口。');
  if (available > 0 && horizonYears === 0) warnings.push('剩余资金的可持有年数为0，不能据此安排长期投资。');
  if (reserve === 0) warnings.push('当前明确未预留备用金；请核对这是否符合真实需求。');
  let stress = null;
  if (input.stressEnabled === true) {
    if (!Array.isArray(input.allocations) || input.allocations.length !== 6) throw new InputError('情景测算需要完整六类资产输入');
    const lossBudget = number(input.lossBudget, '剩余资金的损失预算');
    const budgetYears = number(input.budgetYears, '预算观察年数', 0.01, 80);
    const rows = input.allocations.map((a,i) => ({name: ['权益','债券','商品','另类','现金','其他'][i], weight: number(a.weight, `第${i + 1}类权重`, 0, 100), shock: number(a.shock, `第${i + 1}类情景变化`, -1, 10)}));
    const weightTotal = rows.reduce((sum,a) => sum + a.weight,0);
    if (Math.abs(weightTotal - 100) > 1e-7) throw new InputError(`情景权重合计为${weightTotal.toFixed(4)}%，须为100%，不会自动归一化`);
    if (available <= 0 || horizonYears === 0) warnings.push('未形成可安排且有持有期限的剩余资金，暂不计算配置情景。');
    else {
      const weightedShock = rows.reduce((sum,a) => sum + a.weight / 100 * a.shock,0);
      const pnl = available * weightedShock;
      const loss = Math.max(0,-pnl);
      stress = {rows:rows.map(a=>({...a,amount:available*a.weight/100,pnl:available*a.weight/100*a.shock})),weightTotal,weightedShock,pnl,loss,lossBudget,budgetYears,budgetRate:lossBudget/available,excess:Math.max(0,loss-lossBudget)};
      if (Math.abs(budgetYears-horizonYears)>1e-9) warnings.push('损失预算观察期与资金持有期不同；情景结果仅作单次假设比较，须另行核对时间口径。');
      if (loss>lossBudget) warnings.push('所填情景下的损失超过自填预算；请复核方案和目标约束。');
    }
  }
  let goal = null;
  if (input.goalEnabled === true) {
    goal = computeGoal(input.goal || {});
    if (goal.initialCapital > available + 0.005) throw new InputError('目标的现有专用本金超过剩余可安排资金，不能重复使用备用金或支出预留');
    if (fundingGap>0) throw new InputError('请先解决现有资金缺口，再测算长期目标');
    if (horizonYears === 0) throw new InputError('剩余资金可持有年数为0，不能安排长期目标');
    if (goal.years > horizonYears) warnings.push('目标年数超过已填写的资金可持有年数，请核对是否存在期限冲突。');
  }
  return {engineVersion:ENGINE_VERSION,name,snapshot,total,monthlyEssential,reserveMonths,horizonYears,reserve,needs,earmarked,available,fundingGap,stress,goal,warnings};
}
