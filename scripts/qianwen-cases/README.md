# 千问绑定用户个例分析台（qianwen-first-investor-cases-*）重烘焙

## 2026-10-15 展示与资产验收修正

顶部恢复原有三条短洞察，不展示关系图、公式或扩展说明；口径切换保持单排，窄屏横滑。
案例汇总客群细分为新客、老客首投、老客新投；有资产继续投入的用户为老客再投。
未审完的千问侧/归因切片不进入生产导航，不能把候选推断当成已完成分类。

生产输入须先经 `apply-reviewed-assets.py users.json reviewed-assets.json users-reviewed.json`：
所有用户必须有同一资产日的资产核验，状态仅允许 exact 或有明确证据的 verified_zero；缺失不能默认0。
`validate-alignment.py` 同时校验五个共同客群及全部入金用户的总资产，生成器会阻断未完成资产审查的新版输入。
资金简版案例只展示已核资金和资产字段；不展示“未审查”画像、风测、提问或终端列。

所有客群的提问卡统一为“平均首投提问数”，补充“平均提问数、总提问数”。
生产输入还须经 `apply-question-counts.py users-reviewed.json question-counts.json users-final.json` 完整核对全部用户，零提问需明确查证，不能把未查当0。
首投提问窗口为绑定后至绑定后首笔新增入金之前，严格排除入金同刻及之后；老户再投也用绑定后首笔，不是生命周期首投。
两种平均数的分母均为该客群全部用户（含已核实零提问）。全期提问截止与看板一致，使用业务时间，不用入库时间。
单一新/老客群的人数卡补充24小时内入金人数和多次入金人数；老户唤醒保留首投/清仓后回流拆分。

App审查以 `apply-app-operations.py users-final.json app-operation-stats.json users-ready.json` 合并。
案例汇总“使用设备”仅显示iOS/安卓/鸿蒙；“绑定→首次App操作”取绑定后、截止前首次原生App页面浏览或点击。
设备登记、小程序、H5及后台生命周期事件不作App操作；已查证窗口内无操作显示“未查到操作”，不是未安装。
全部250人都须有审查结果，未审完整不能生成新版生产页。

老户再投矩阵按绑定前后对照：绑定时资产（保留原日快照边界）、今年以来绑定前总入金、绑定前最近交易日、绑定后新增入金、笔数、当前资产。
`apply-binding-history.py users-ready.json binding-history-stats.json users-with-history.json` 要求全250人有经审查的历史结果；缺失不能填0，最近交易严格早于绑定。
其余六客群保留首笔入金、入金次数、总入金、首笔入金提问数和总提问数；前者问题窗口只到首笔之前。
卡片人均资产/入金/笔数按本客群全部人数；二次入金间隔按首笔至第二笔，仅对有二次入金的人计算均值及中位数。

七个客群都展示注册日期和历史首次入金日期，先用 `apply-first-inflow-dates.py` 合并全历史核验结果，不能拿绑定后首笔替代人生首笔。
表格列头三态排序：升序、降序、恢复。金额、日期和间隔按原始值；同值按原序，缺失始终末尾；原行节点与个例跳转保留，合计行不参与排序。

## 2026-10-15 全量提问用户双Top100

`build-question-top100.mjs <repo> <private-input-dir> <private-output-dir> [users-ready.json]` 读取已审查的两榜和原文。
总量榜/观察日均榜分别100人，日均分母为首次有效提问至截止日（含首尾）的自然日，不是活跃日数；末日未满全天需提示。
原文分用户AES-GCM加密，匿名键作AAD；只在点击用户或原文按钮后加载，不把142人的原文一次性塞进首屏。
已确认默认题、推荐题匹配（推断）与其它输入（来源未确认）分开，不能把未匹配输入直接叫主动提问。
生成器输出私有发布清单；仅清单中当次加密文件进入public/docs，明文原件和内部ID不得提交。
`build-cases.py` 的第四个可选参数接受私有 `question-top100-fragment.html`，模块放在原案例后，不改变原顶部。
Top100展示总提问、日提问、活跃日、使用频次、最近使用和是否入金，六列均可三态排序，仅重排当前榜成员，不重新取原文。
使用频次=首末活跃日期之差÷（活跃日−1）；单活跃日只写“仅1日”。最近使用为最后有效千问用户输入，入金标记为同截止前绑定后新增入金。
仅改UI时，`build-question-top100.mjs --render-only <repo> <existing-private-output>` 可沿用已审元数据与原加密文件，不重写明细。

## 2026-10-15 新分类（优先于下文旧说明）

个例全集现覆盖绑定后有入金的用户，四个互斥叶子为新户首投、老户首投、老户回流、有资产老户再投。
新投=新户首投+老户首投+老户回流；首投=新户首投+老户首投；老户唤醒=老户首投+老户回流。
汇总标签存在包含关系，不能把所有页签人数相加。页面保留用户给的直白定义，不重复展开入金支付方式。

`extend-funded-users.py` 将已审查的丰富个例与全量资金候选、逐笔入金原件合并，所有原件只留在私有临时目录；
新增有资产老户仅提供已取证的资金卡，未提取的提问、终端、当前资产不能写成零。
资产为空不自动视为零：需结合开户时间、完整入金和产品历史；资产时点采用绑定日及之前最近日快照，并不是精确绑定瞬间。
新户当前仍用注册与首次绑定相差不超过60分钟作近似，不声称已证明注册来源。

千问侧与千问归因是有资产老户再投的两种可交叉证据标签，不是互斥叶子。
千问侧推断需千问正向活跃证据、交易前窗口无可识别且慢操作；不明H5或缺失埋点不能直接视作千问成交。
促进规则检查入金前具体产品提问与此前该产品持有证据；只证明规则关联、不声称因果。
首笔窗口审查不能充作全期所有入金审查；未审查/证据不足使用 None，不能当 false 或 0 人。
交易源现只直接证明未撤单受理，除非另查确认状态，不称逐笔已确认成功到账。

本轮只更新千问个例，豆包模板保持原版本。`derive-from-qianwen.py` 的锚点保护在模板分叉时应阻断，
未来若同步豆包应先明确适用分类、更新派生锚点并完整测试，不能盲目运行派生覆盖。

页面是静态烘焙的加密单页，**不随看板 latest.json 联动**；要更新按以下步骤重跑（约 20 分钟，主要是候选 SQL）。

```bash
W=$(mktemp -d)/cases && mkdir -p $W && S=scripts/qianwen-cases
CUT='2026-09-17 16:45:49'          # 与看板 data_cutoff 一致
# 1. 候选用户：绑定后有新增入金，且（绑定时 ROOT 资产为 0/未开户 或 人生首笔新增入金在绑定后）
#    SQL 见 assemble-users.py 头部注释所需字段；输出 JSON（fetch.py <out.json> "<sql>" [timeout]）
python3 $S/fetch.py $W/candidates.json "<候选 SQL>" 900
# 2. 明细：trades / risk / asks / assets(ta 序列) / device / flows(ROOT input/output) —— 字段名见 assemble-users.py
python3 $S/fetch.py $W/d_trades.json "..." ; ... d_risk d_asks d_assets d_device d_flows
#    ↑ 以上两步（含第 3 步的 m_*.json）已固化为一条命令：CASE_CUT="$CUT" CASE_AD=<资产快照日> CASE_WORK=$W $S/fetch-all.sh
# 3. 归一化 + 生成 + 加密
cp $S/narratives.json $W/            # 已有个例的手写叙事与渠道判定（按 pmid），新用户可追加
python3 $S/assemble-users.py $W "$CUT" <bound_total>
python3 $S/validate-alignment.py public/reports/qianwen-user-acquisition-dashboard/data/latest.json $W/users.json
python3 $S/build-cases.py $W/users.json $W/page.html $S/base.css
node $S/encrypt-page.mjs $W/page.html public/reports/<slug>/index.html "千问绑定用户个例分析台"
cp public/reports/<slug>/index.html docs/reports/<slug>/index.html   # docs 副本须在 build 前就位
```

口径要点：个例页分类名称与主看板对齐 = 新投 / 首投 / 新户首投 / 老户唤回 / 老户首投；
入金与主看板同口径：绑定后线上/线下充值到盈米宝 + 银行卡直付买产品；组合回款进宝、宝内余额买产品不计；
钱包充值即使尚未买入产品，也进入新投/首投；首投、新户首投均以人生首笔合格新增入金为准。`first_buy_ever` 仅保留产品买入事实，不参与首投分类；
老户唤回拆为“首次入金的老户首投”与“历史有入金、资产清零后的再次入金”，两项可点击筛选个例；
发布前必须通过 `validate-alignment.py`，确保两页截止时刻一致，新增入金客群、五个共同客群及案例并集全部闭合；
渠道判定规则驱动（device_info platform 3=iOS/4=安卓/5=鸿蒙 + 订单 extra + 时间线），有手写 verdict 的用户优先用手写。
候选 SQL 的 asset_at_bind 子查询要加 `CASE WHEN account3_id IS NULL THEN NULL ELSE (...) END` 短路，否则 5k 用户会超时。
新加密子页落库五处：public+docs 密文、inject-site-access-gate.mjs、tests/site-access-gate.test.mjs、validate-workbench.mjs、catalog/report-registry.json（supporting-page）。

## 2026-09-17 晚追加：小顾入口 / 下单终端 / App 操作 / 最终持有

assemble-users.py 额外读取（缺失则跳过）：`m_sessions.json`（agent_dj_sessions LEFT JOIN qwen_a2a_session_map，is_qwen 标千问会话；另一 agent 844489… 为且慢 App 内小顾 3.0）、
`m_mia_msgs.json`（ying99_mia.user_message = 且慢 App 内小顾 Mia，sender_id='USER' 行，scene/query_mode）、`m_tokens.json`（ying99_qieman.qwen_issued_token，
千问侧 agent 登录令牌签发时刻=千问会话活跃时刻）、`m_combine17.json`（dwd combine 当日全层级行，CA/WALLET 子账户市值）、`m_bill.json`
（dwd_ast_bill_user_holding_detail_monthly_full 月末基金明细）、`m_fundorders.json`（ying99_fundtxn.fund_order，account_id=account3_id，
order_type=1 按 fund_code 汇总成功金额，穿透组合底层基金）。CA→组合名：asset_service_account.meta 无数据时按绑定后买入金额就近匹配。
口径限制：fund_order.txn_source 是销售机构代码非终端；微信/企微侧小顾（advisor_conversation）七人均无记录；「千问内嵌 H5 vs App」仍为推断。

`m_surnames.json` 为作者端临时输入，仅保存 `pmid` 与从 `portfolio_manager_info.real_name` 提取的首字姓氏；完整姓名不进入生成数据与版本库。个例标题以「姓氏+性别」展示（如「李男」），缺失时仅显示性别。

## 2026-09-18 下午：神策埋点接入（且慢行为 / 下单终端）+ 个例卡改版

- 新增可选输入 `m_sensors.json`：`qm_meta.ai_insight_sensors_event_detail`，按 `broker_user_id`（= po_manager_id）拉 `event_date>='2026-08-01'` 的
  `event/event_category/page_name/screen_name/title/element_content/lib/event_time`（fetch.py 一条 SQL，7 人约 5k 行，LIMIT 20000 足够）。
  `lib` = iOS / Android / HarmonyOS 为 App 原生页，`js` 为内嵌或独立 H5。assemble-users.py 用 PAGE_MAP 把类名译成业务页名，不可读类名丢弃，
  输出每人 `events`（绑定前 7 天起至截止）与 `inflow_txns`（看板口径：线上/线下充值 + 银行卡直付买入）。
- 埋点推翻了 4 个手写渠道判定（B/D/E/F 其实都在 iOS App 内下单），故 narratives.json 的 `verdict` 已删除，
  「用户路径与行为总结」改为 build-cases.py `path_summary()` 规则生成（白话，不出现字段名/令牌/by.online）。
- 个例卡结构：顶部四格（入金+资产快照 / 绑定→首笔入金 / 入金笔数+前两笔日期 / 小顾对话三端拆分+全量弹窗图标）→
  「关键旅程｜且慢行为」双 TAB → 路径与行为总结（绿框）→ 最终持有（新增「入金金额」列与合计）。分页只保留 › 且循环。
- 小顾对话弹窗顶部支持按「全部 / 千问 / 且慢 / 微信」筛选提问；筛选数量、列表与空状态同步更新。
- 页面用户编号统一用匿名数字展示（原 A→1、B→2…），表格、个例、对话弹窗和跳转定位保持一致。
- 个例卡头部不展示地点和装置，统一展示千问绑定日、App 下载日、首投日与最新风测分；复制 ID 的低调图标移至头部，卡尾重复信息整行移除。
- 金额展示统一简化为「入金 / 买入」：入金指充值盈米宝或银行卡直接买入，买入指实际买进基金或组合；两者差额通常为盈米宝留存，买入高于入金时来自绑定前余额或回款。
- 标题下方只展示一行小字总结（不换行，窄屏省略）；分类标签与主看板同名同义，并补齐「老户首投」。

## 2026-09-18 晚：个案洞察与转化路径

- `narratives.json` 为每位用户维护四个作者研判字段：`insight`（个案定义）、`conversion_path_label`（转化路径类型）、`conversion_path`（按真实行为展开的跨端关键决策路径，步骤数不固定）与 `behavior_insight`（行为特性和主要影响因素）。这些内容必须逐例结合提问、App 行为和交易时点判断，不能套固定信息摘要模板。
- 个案卡首屏将原「一句话」和行为总结合并为紧凑的深色洞察块：先给出案例判断，再直接承接关键决策路径；不另设路径标题或独立浅色卡片区，避免同义信息重复和大块空白。
- 卡片主体使用「关键旅程｜且慢行为｜入金产品」三 TAB。「且慢行为」只保留下单关键时点，高频逐日浏览/点击日志折叠到「查看按日浏览与操作明细」；时序链只说明行为先后和伴随关系，不把单一提问或页面归因为下单原因。
- 原卡尾「最终持有」改为「入金产品」页签，集中展示买入去向、入金金额、当前市值及基金穿透；页面底部不再展示大段「口径与局限」模块。
