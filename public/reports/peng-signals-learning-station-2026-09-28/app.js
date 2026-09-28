const resources = [
  {
    id: "vista-ai-2026", date: "2026-09-09", topic: "AI与顾问", statuses: ["confirmed", "recovered"], accent: "#4fe7ff",
    title: "财富管理 AI 采用现状", original: "State of Wealth Management AI Adoption", source: "Cerulli × Vista Equity Partners", pages: "报告摘要（完整版需申请）",
    summary: "AI 成熟度的分水岭不是公司规模或预算，而是治理结构、明确负责人、培训与结果度量。AI 先释放行政产能，再扩大顾问服务能力。",
    metrics: [["64%", "减少手工与行政工作"], ["46%", "改善客户沟通质量"], ["8%→15%", "AI 占技术预算"], ["12%", "达到 Leading 层级"]],
    takeaways: ["68 家 RIA、合计约 1.2 万亿美元 AUM；59% 受访者为 C-level。", "初级顾问、客户服务人员与高级顾问仍是未来两年最可能增加的岗位。", "领先者把 AI 嵌入顾问和后台工作流，并追踪效率、服务扩张或收入结果。"],
    yingmi: ["不要以调用量或模型数量衡量 AI；改成节省时长、任务完成、采纳、服务覆盖和收入结果。", "建立“探索—规模化—领先”成熟度模型，为机构客户提供诊断、治理、培训与实施套餐。", "AI 小顾和顾问工作台应共同强化人类顾问的关系经营，而不是把“无人化”当目标。"],
    sourceUrl: "https://www.vistaequitypartners.com/insights/the-state-of-wealth-management-ai-adoption/", secondaryUrl: "https://www.cerulli.com/resource/white-paper-state-of-wealth-management-ai-adoption",
    relation: "群聊画面已确认；官方全文入口已恢复", originalState: "官方研究页可访问；完整报告需提交机构表单", translation: "中文精读已完成"
  },
  {
    id: "schwab-ria-2026", date: "2026-07-15", topic: "RIA经营", statuses: ["local", "recovered"], accent: "#b7f36b",
    title: "2026 RIA 经营基准", original: "Insights from the 2026 RIA Benchmarking Study", source: "Charles Schwab Advisor Services", pages: "56 页",
    summary: "一张关于 RIA 如何增长、留客、用 AI、招人和提高运营效率的经营地图。高绩效机构靠明确战略与标准化流程形成复利。",
    metrics: [["1,236", "参调 RIA 机构"], ["$2.5T", "合计 AUM"], ["97%", "十年客户留存"], ["83%", "大型机构使用 AI"]],
    takeaways: ["2025 年样本机构 AUM 增长 17%，收入增 13.2%，客户数增 4.7%。", "有书面营销计划、理想客户画像和价值主张的机构，新客数高 87%，新客资产高 127%。", "Top Performing Firms 从老客获得的新增资产是其他机构的 4.2 倍。"],
    yingmi: ["建立“老客增资—新客资产—流失—行情—渠道”的增长瀑布，不再只看总保有。", "工作台 V1 先打通客户、账户、任务、沟通、报告、服务 SOP 和经营指标。", "将 AI 指标从“有没有用”升级为“释放多少运营时间、增加多少有效服务”。"],
    sourceUrl: "https://advisorservices.schwab.com/managing-your-business/business-consult/benchmarking",
    relation: "电脑中发现完整原件；官方研究页已核验", originalState: "本机已保存完整原件；公开站仅链接官网", translation: "中文精读已完成"
  },
  {
    id: "vanguard-altruist", date: "2026-08-26", topic: "平台与并购", statuses: ["confirmed", "local", "recovered"], accent: "#ffcb6b",
    title: "先锋领航收购 Altruist", original: "Vanguard to Acquire Altruist", source: "Vanguard / PENG 研究短报", pages: "3 页内部短报 + 官方公告",
    summary: "Vanguard 不是简单买一家软件公司，而是买进 RIA 托管、顾问工作流与客户触达基础设施。官方没有披露交易金额。",
    metrics: [["2018", "Altruist 成立"], ["2020", "Vanguard 首次投资"], ["独立运营", "交割后组织安排"], ["未披露", "官方交易对价"]],
    takeaways: ["Altruist 将保留品牌、领导团队、顾问定位和独立运营模式。", "Vanguard 的核心叙事是用技术扩大高质量建议的覆盖，而不是削弱人的判断和关系。", "PENG 短报提到 46 亿美元估值，但 Vanguard 官方公告明确写的是交易条款未披露，本站按官方口径处理。"],
    yingmi: ["顾问基础设施的价值来自“托管/交易/数据/工作流/AI”闭环，而非孤立功能。", "国内买方投顾的稀缺资产是可信账户语境、持牌交易能力、服务 SOP 与顾问网络。", "任何估值推演都要分开“公开披露事实”和“市场估计”。"],
    sourceUrl: "https://corporate.vanguard.com/content/corporatesite/us/en/corp/who-we-are/pressroom/press-release-vanguard-announcement-082626.html", secondaryUrl: "https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/expanding-reach-and-impact-of-financial-advice.html",
    relation: "群聊画面及本地短报均已确认；官网公告已恢复", originalState: "PENG 短报留在本地；公开站引用 Vanguard 官方原文", translation: "中文精读与事实校正已完成"
  },
  {
    id: "hazel-stack", date: "2026-09-03", topic: "AI与顾问", statuses: ["confirmed", "expanded", "recovered"], accent: "#a995ff",
    title: "Hazel：折叠顾问科技栈", original: "Hazel Is on a Mission to Collapse the Tech Stack", source: "Altruist", pages: "官方案例",
    summary: "典型顾问公司同时使用约 12 套割裂软件。Hazel 试图建立统一客户语境层，自动起草财务/税务规划并生成会前准备与跟进任务。",
    metrics: [["12", "典型顾问软件数量"], ["45%", "顾问用于后台工作的时间"], ["92.8%", "不超过 100 人的顾问机构"]],
    takeaways: ["每次文档、会议、邮件与 CRM 更新都进入同一个客户语境。", "AI 先形成规划草案，再由顾问复核；复杂计算交给内置金融计算程序。", "目标不是加一个聊天框，而是让部分割裂软件和重复录入变得不必要。"],
    yingmi: ["将“客户上下文层”作为工作台底座：身份、资产、目标、沟通、任务和授权统一。", "小顾负责意图与编排，确定性计算交给 MCP/金融引擎，最终建议保留顾问复核。", "优先攻击会议准备、组合诊断、规划草案、跟进和合规留痕等跨工具高摩擦流程。"],
    sourceUrl: "https://altruist.com/insights/hazel-is-on-a-mission-to-collapse-the-tech-stack-for-financial-advisors/",
    relation: "由 PENG 分享的新闻线索延展核验", originalState: "官方网页可直接访问", translation: "中文精读已完成"
  },
  {
    id: "piper-awm-2024", date: "2025-03-01", topic: "平台与并购", statuses: ["confirmed", "recovered"], accent: "#ffcb6b",
    title: "2024 资管与财富管理并购白皮书", original: "2024 Asset & Wealth Management Whitepaper", source: "Piper Sandler", pages: "42 页",
    summary: "PENG 曾指出这份白皮书适合观察财富管理平台的估值逻辑。报告显示，资本持续为可扩张的平台、有机增长与并购整合能力付溢价。",
    metrics: [["278", "财富管理交易"], ["67%", "PE 支持平台完成"], ["$5.0B", "平均目标 AUM"], ["50+", "PE 支持的平台"]],
    takeaways: ["2024 年财富管理交易仍接近历史高位，平台型买家占主导。", "规模、有机增长率和并购整合记录，是买家愿意支付 EBITDA 倍数的核心因素。", "顾问平台正在从“渠道”变成资本化的经营基础设施。"],
    yingmi: ["若做估值故事，必须证明可持续有机增长、客户留存、人均产能和平台复用。", "机构 AI 业务要从项目收入升级为可复制的平台能力与持续服务收入。", "并购案例可用来反推：哪些经营指标需要现在开始长期积累。"],
    sourceUrl: "https://www.pipersandler.com/sites/default/files/document/2024Asset%26WealthManagementWhitepaper%28March%202025%29_vFinal.pdf",
    relation: "群聊画面确认；过期文档已从官网恢复并校验", originalState: "42 页 PDF 已恢复到本地私有档案", translation: "中文精读已完成"
  },
  {
    id: "stay-calm", date: "2026-09-01", topic: "投资哲学", statuses: ["confirmed", "recovered"], accent: "#ff7d91",
    title: "保持冷静：拥抱不确定性", original: "Stay Calm: Learn to Embrace Uncertainty in Investing and Life", source: "David Booth / Dimensional", pages: "新书与官方访谈",
    summary: "David Booth 用个人经历、现代金融史与长期研究解释：投资不是消除不确定性，而是建立能让自己长期留在市场里的原则。",
    metrics: [["50+ 年", "投资实践"], ["$1T+", "Dimensional AUM"], ["2026-09", "正式出版"]],
    takeaways: ["不确定性不是投资的缺陷，而是风险溢价与机会的来源。", "长期结果依赖能否坚持一套理解并信任的过程，而不是每次预测正确。", "顾问的价值之一，是阻止客户在情绪最强时做出破坏长期计划的决定。"],
    yingmi: ["投教内容不应只解释市场，还要帮助客户建立可坚持的决策原则。", "把“保持冷静”落成服务动作：风险预演、波动陪伴、计划提醒与行为复盘。", "AI 可以扩大陪伴频率，但信任、同理心与最终判断仍需由人承担。"],
    sourceUrl: "https://www.dimensional.com/us-en/newsroom/investing-pioneer-david-booth-offers-a-timely-guide-to-navigating-uncertainty-in-stay-calm", secondaryUrl: "https://www.dimensional.com/us-en/insights/dont-fight-the-stock-market-make-it-work-for-you",
    relation: "群聊文字已确认；官方新书与访谈入口已恢复", originalState: "书籍受版权保护；本站只给官方入口与原创精读", translation: "核心观点中文精读已完成"
  },
  {
    id: "vanguard-advice-economics", date: "2025-10-21", topic: "服务与定价", statuses: ["local", "recovered"], accent: "#4fe7ff",
    title: "金融建议的成本与服务", original: "Financial Advice Economics: What SEC Filings Reveal", source: "Vanguard Research", pages: "20 页 · 中英双份",
    summary: "Vanguard 用生成式 AI 分析 2.6 万多个美国投顾服务方案，发现相似服务之间的价格差异巨大，数字化与人工服务需要按价值透明匹配。",
    metrics: [["26,000+", "分析的服务方案"], ["40%", "纯数字建议更便宜"], ["$225–1,500", "$10 万资产的混合服务年费"], ["21", "服务项目分类"]],
    takeaways: ["80% 的混合建议方案年费落在 225–1,500 美元，价差超过六倍。", "工作场所渠道往往用机构议价、受托监督和规模效应实现更低费率与更多服务。", "高收费一般对应更多服务，但专业税务、遗产与慈善规划并不总是覆盖。"],
    yingmi: ["将服务包从“统一费率”拆成明确权益、频率、人工参与和可交付成果。", "顾问服务的价值证明要同时覆盖投资结果、时间节省、情绪价值和目标进展。", "机构侧可用 AI 解析服务协议与运营数据，建立同类定价与覆盖对标。"],
    sourceUrl: "https://corporate.vanguard.com/content/dam/corp/research/pdf/financial_advice_economics_what_sec_filings_reveal_about_costs_and_services.pdf",
    relation: "本机发现英文原件与中文翻译版；官网原文已核验", originalState: "本机保留 20 页中英版本；公开站链接官网英文原文", translation: "本地已有完整中文翻译"
  },
  {
    id: "mic-peng-abcg", date: "2025-05-22", topic: "买方投顾", statuses: ["local"], accent: "#b7f36b",
    title: "买方投顾的 A、B、C 与 Gamma", original: "买方投顾促进公募基金高质量发展的 A, B, C 和 Gamma", source: "陈鹏 / Morningstar", pages: "49 页",
    summary: "用 Beta、Alpha、Cost 与 Gamma 重述基民收益：投顾不仅寻找超额收益，更要降低成本、减少行为损失，并把客户留在可执行的长期计划里。",
    metrics: [["A+B−C−G", "基民收益框架"], ["2.45%", "顾问增值估计"], ["1926–2024", "美国长期资产样本"]],
    takeaways: ["Beta 是最容易规模化、容量大且成本低的长期收益来源。", "Alpha 获取困难，费用与高换手可能持续侵蚀投资者结果。", "Gamma 来自资产配置、目标规划、行为陪伴、税务与纪律等顾问价值。"],
    yingmi: ["产品表达从“选到好基金”升级为“提高投资者实际获得的收益”。", "对每项服务标注主要影响 Beta、Alpha、Cost 还是 Gamma，形成价值地图。", "行为损失需要有可度量代理指标：追涨杀跌、频繁查看、短持赎回与计划偏离。"],
    relation: "电脑中发现署名完整原件", originalState: "内部原件仅本地保存，不在公开站托管", translation: "中文原稿，无需翻译"
  },
  {
    id: "dimensional-advisor-study", date: "2025-01-30", topic: "RIA经营", statuses: ["local"], accent: "#b7f36b",
    title: "全球顾问公司的增长燃料", original: "Fueling Your Firm: Insights from Dimensional’s Global Advisor Study", source: "Dimensional", pages: "41 页 · 中英双份",
    summary: "从战略、增长、人力、投资运营和客户体验五个维度拆解高绩效顾问公司，并把产能瓶颈、服务模型与转介绍放进同一套经营系统。",
    metrics: [["1,000+", "独立顾问公司"], ["100K+", "终端客户反馈"], ["48%", "新客来自现有客户推荐"], ["$869K", "推荐新客中位规模"]],
    takeaways: ["高绩效不是单一增长率，而是收入增长、客户/员工留存、利润率与顾问产能的组合。", "现有客户推荐仍是最主要的新客来源，关键影响者推荐带来的客户规模更大。", "先分层并标准化服务模型，再谈规模扩张。"],
    yingmi: ["建立“客群—服务频率—人力成本—客户价值”的分层模型。", "把转介绍从自然发生升级为触发、邀约、跟进和归因流程。", "在顾问工作台记录每类客户的服务投入与经营回报。"],
    relation: "电脑中发现英文原件和完整中文翻译", originalState: "材料标明不供公众分发，因此本站只展示原创摘要", translation: "本地已有完整中文翻译"
  },
  {
    id: "lpl-growth-2025", date: "2025-09-01", topic: "RIA经营", statuses: ["local", "expanded"], accent: "#b7f36b",
    title: "顾问增长研究：从直觉到指标", original: "Scaling with Precision — Advisor Growth Study", source: "LPL Financial", pages: "14 页",
    summary: "基于 14,000 多名顾问的六年真实业务数据，用机器学习寻找可重复的增长行为：打基础、分客群、做深服务、主动获客。",
    metrics: [["14,000+", "顾问样本"], ["100+", "经营变量"], ["18%+", "头部 AUM 年增长"], ["3×", "相对中位增长"]],
    takeaways: ["Top growers 把客户减持阶段占比控制在 35% 以下。", "前 10% AUM 客户贡献的增长保持在 30%–60%，避免过度集中或低效分散。", "顾问资产中建议类资产占比达到 60%+，每年新客约占 10%。"],
    yingmi: ["构建中国版 Advisor Growth Index，把客户获取、深耕和留存连起来。", "不只比较结果，更要找能被顾问改变的行为变量。", "将个性化经营建议嵌入工作台，而不是停留在年度报告。"],
    relation: "本机发现完整原件；作为 RIA 经营主题扩展", originalState: "原件本地保存；公开站呈现原创精读", translation: "中文精读已完成"
  },
  {
    id: "cfp-ai-2025", date: "2025-11-19", topic: "AI与顾问", statuses: ["local", "expanded", "recovered"], accent: "#a995ff",
    title: "AI 时代的财务规划职业", original: "Leading the Future: Harnessing AI in the Financial Planning Profession", source: "CFP Board", pages: "33 页",
    summary: "以公众信任和科技新进入者的冲击程度为两条轴，推演 2030 年的四种未来，并给顾问、机构、教育与技术提供者行动清单。",
    metrics: [["77%", "消费者不信任企业负责地使用 AI"], ["96%", "顾问看好 GenAI"], ["4", "2030 情景"], ["15", "AI 工作组专家"]],
    takeaways: ["无论情景如何，信任、判断、同理心与行为辅导仍是人类顾问的核心。", "AI 可以提升个性化和效率，但同时放大透明度、问责与伦理风险。", "未来顾问需要同时加强税务/私募等专业能力和关系、教练、心理等人类能力。"],
    yingmi: ["将 AI 治理和顾问能力培养做成同一个项目，而不是分开的技术与培训动作。", "建立面向客户的 AI 使用披露与人工复核标准。", "用情景推演做产品路线压力测试：低价 AI、高触达人工、混合共驾分别如何竞争。"],
    sourceUrl: "https://www.cfp.net/industry-insights/reports-and-statistics/harnessing-ai-in-the-financial-planning-profession",
    relation: "本机发现完整原件；官网来源已核验", originalState: "完整报告本地保存，官网提供下载入口", translation: "中文精读已完成"
  },
  {
    id: "fsi-ai-governance", date: "2025-12-10", topic: "AI与顾问", statuses: ["local", "expanded", "recovered"], accent: "#a995ff",
    title: "金融服务 AI：创新、互操作与监督", original: "Artificial Intelligence: Balancing Innovation, Interoperability, and Oversight", source: "Financial Services Institute", pages: "27 页",
    summary: "一套非常适合落地的金融 AI 治理框架：九因素使用决策矩阵、四阶段互操作成熟度，以及原则导向的监管建议。",
    metrics: [["9", "AI 使用评估因素"], ["4", "互操作成熟阶段"], ["3", "治理模块"]],
    takeaways: ["选择 AI 场景前同时评估价值、敏感性、复杂度、人类监督、可逆性与供应商风险。", "互操作不是简单 API 连接，还包括数据标准、权限、语义和审计。", "监管应保护投资者，同时避免用静态规则锁死快速变化的技术。"],
    yingmi: ["把九因素矩阵做成 OAP 场景准入与变更审查表。", "为 MCP/Skill/Agent 定义统一身份、授权、日志、版本与回退协议。", "面向机构输出治理能力，而不只是工具能力。"],
    sourceUrl: "https://financialservices.org/fsi-releases-new-ai-white-paper-to-guide-adoption-across-financial-services/",
    relation: "本机发现完整原件；作为 AI 治理主题扩展", originalState: "27 页原件已本地保存；官网提供公开说明与下载", translation: "中文精读已完成"
  },
  {
    id: "global-investor-study", date: "2025-09-19", topic: "服务与定价", statuses: ["local", "expanded"], accent: "#4fe7ff",
    title: "客户为什么愿意推荐顾问", original: "Global Investor Study — Key Takeaways", source: "Dimensional", pages: "6 页",
    summary: "客户口中的价值不是跑赢市场，而是安全感、目标进展和“顾问真正了解我的财务状况”。高 NPS 并不会自动变成转介绍。",
    metrics: [["77.7", "客户 NPS"], ["82%", "客户属于 Promoter"], ["24%", "过去一年实际转介绍"]],
    takeaways: ["客户推荐意愿处于高位，但实际推荐行为远低于意愿。", "安全感/安心与目标进展是最稳定的价值维度。", "转介绍需要清晰时机、具体对象和低摩擦动作。"],
    yingmi: ["把“安心”和“目标进展”转成可观察的客户体验指标。", "在服务高光时刻触发转介绍，而不是做长期静态入口。", "将推荐意愿、实际推荐、合格线索和最终资产分开归因。"],
    relation: "电脑中发现完整原件；作为客户价值主题扩展", originalState: "原件本地保存；公开站仅展示摘要", translation: "中文精读已完成"
  },
  {
    id: "wealthfront-s1", date: "2025-09-29", topic: "平台与并购", statuses: ["local", "expanded", "recovered"], accent: "#ffcb6b",
    title: "Wealthfront 的平台经济学", original: "Wealthfront Corporation Form S-1", source: "SEC / Wealthfront", pages: "本地 18 页摘录",
    summary: "从公开申报文件观察数字财富平台的收入、获客、产品结构与监管边界。它提供的是一套可核验的商业模式证据，而非公司宣传稿。",
    metrics: [["S-1", "公开上市申报"], ["SEC", "监管原始出处"], ["2025-09", "申报时间"]],
    takeaways: ["研究数字财富平台，应优先看监管申报、审计财务和风险因素。", "自动化、低成本和直达客户并不意味着没有高昂的获客、合规与研发投入。", "产品广度与客户资产深度共同决定长期单位经济。"],
    yingmi: ["用公开申报的结构建立财富科技公司对标模板。", "将收入、资产、客户、获客成本、留存与产品交叉使用放在同一张表。", "避免只用功能数量判断平台价值。"],
    sourceUrl: "https://www.sec.gov/edgar/search/",
    relation: "电脑中发现公开申报摘录；作为平台经济扩展", originalState: "本地保存摘录；完整原件可从 SEC EDGAR 获取", translation: "中文精读已完成"
  },
  {
    id: "fund-fee-study", date: "2024-07-01", topic: "投资哲学", statuses: ["local", "expanded"], accent: "#ff7d91",
    title: "美国基金费率研究", original: "2023 U.S. Fund Fee Study", source: "Morningstar Manager Research", pages: "45 页",
    summary: "费用不是一个附属信息，而是投资者可控制、对长期结果影响稳定的变量。行业费率下降由低费产品资金流入与高费产品退出共同推动。",
    metrics: [["45 页", "完整研究"], ["2023", "数据年度"], ["2024-07", "发布"]],
    takeaways: ["投资者持续向低成本基金迁移。", "费率比较要区分投资者实际支付与产品名义收费。", "长期复利会放大看似很小的年度费率差。"],
    yingmi: ["在产品比较中突出“全费用”和长期复利影响，而非只列管理费。", "顾问价值应以扣除产品与交易成本后的客户结果衡量。", "将低成本 Beta 与行为陪伴结合，是更稳的买方投顾主张。"],
    relation: "电脑中发现完整原件；作为费用与投资者结果主题扩展", originalState: "原件本地保存；公开站不重新分发", translation: "中文精读已完成"
  },
  {
    id: "morningstar-ria", date: "2024-03-01", topic: "RIA经营", statuses: ["local", "expanded"], accent: "#b7f36b",
    title: "成为独立 RIA 的三类机会", original: "3 Opportunities When Becoming an Independent RIA", source: "Morningstar Voice of the Advisor", pages: "7 页",
    summary: "独立 RIA 获得更大产品与客户选择权，但也失去大机构提供的品牌、技术、合规和运营支持；真正机会来自专业化与平台化补位。",
    metrics: [["650", "顾问样本"], ["2023", "Voice of Advisor 调研"]],
    takeaways: ["独立让顾问可以围绕特定客群建立专长，而不被自有产品配额束缚。", "主要挑战来自技术、合规、营销与运营负担。", "平台价值在于提供共享基础设施，同时保留顾问的客户关系与独立性。"],
    yingmi: ["机构业务不只卖数据或基金，还应补齐独立顾问的运营缺口。", "清楚划分平台能力与顾问品牌，避免与顾问争夺终端关系。", "以专业客群模板和标准服务包帮助顾问快速建立差异化。"],
    relation: "电脑中发现完整原件；作为 RIA 结构主题扩展", originalState: "原件本地保存；公开站仅展示摘要", translation: "中文精读已完成"
  },
  {
    id: "advisor-client-exit", date: "2026-06-17", topic: "服务与定价", statuses: ["local", "expanded"], accent: "#4fe7ff",
    title: "客户辞退顾问后会做什么", original: "After Firing an Advisor: What Do Clients Do Next?", source: "Morningstar Behavioral Research", pages: "9 页 + 2 页文章",
    summary: "把客户流失从“结果数字”变成可研究的服务失败：为什么离开、下一次寻找什么、哪些经历会影响新顾问选择。",
    metrics: [["9 页", "研究报告"], ["2 页", "配套文章"], ["2026-06", "发布"]],
    takeaways: ["离开旧顾问的客户不是天然红旗，他们往往更知道自己需要什么。", "事后访谈难做，因此需要在服务中持续捕捉失望信号。", "流失原因必须区分关系、沟通、价值、业绩、费用与人生变化。"],
    yingmi: ["建立客户流失原因编码，并让客服、顾问、产品与交易行为能相互校验。", "在明显赎回前识别沉默、低互动、计划偏离和多次未解决问题。", "把离场客户的下一步去向纳入产品与竞争分析。"],
    relation: "电脑中发现两份完整原件；作为客户留存主题扩展", originalState: "原件本地保存；公开站仅展示摘要", translation: "中文精读已完成"
  },
  {
    id: "ai-disclosure", date: "2025-01-30", topic: "AI与顾问", statuses: ["local", "expanded"], accent: "#a995ff",
    title: "顾问需要向客户披露 AI 吗", original: "Do You Need to Tell Your Clients You’re Using Generative AI?", source: "Morningstar", pages: "网页存档 1 页",
    summary: "披露不是增加恐惧，而是提前解释：AI 在哪里参与、数据如何处理、谁负责复核、出现错误时谁承担责任。",
    metrics: [["4 问", "建议披露框架"], ["人类负责", "最终问责"]],
    takeaways: ["客户最关心的不是模型名称，而是隐私、错误、偏差和人类监督。", "在问题发生前解释边界，比事后补救更能建立信任。", "不同风险场景需要不同披露深度。"],
    yingmi: ["为小顾和机构智能体建立统一 AI 使用说明。", "将模型参与、数据使用、人工复核和责任边界放进每个高风险工作流。", "披露应与审计日志和人工确认机制一致。"],
    relation: "电脑中发现网页 PDF 存档；作为 AI 信任主题扩展", originalState: "本地保存网页存档；公开站仅展示摘要", translation: "中文精读已完成"
  },
  {
    id: "internal-inventory", date: "2026-09-28", topic: "整理进度", statuses: ["local"], accent: "#eef5ff",
    title: "微信迁移资料全量索引", original: "Local WeChat Evidence Inventory", source: "本机微信迁移目录", pages: "276 个可见文件；127 份文档/压缩包；89 份 PDF",
    summary: "文件级取证清单已生成，包含相对路径、月份、格式、大小、修改时间、主题标签、翻译标记、SHA-256 和精确重复组。",
    metrics: [["276", "全部可见文件"], ["1.49GB", "文件总体积"], ["127", "文档/压缩包"], ["7", "文档重复组"]],
    takeaways: ["迁移目录中 276 个可直接读取文件均已登记并生成 SHA-256，但不能仅凭文件名证明来自指定群或指定分享者。", "已确认 89 份 PDF 全部可读取；85 份可直接抽取文本。", "合同、内部会议纪要、成员与业务数据不会进入公开 GitHub。"],
    yingmi: ["后续每次增量只需更新文件清单、证据状态和卡片数据。", "将群聊确认、本地候选、官网恢复、延展研究分开，避免资料关系被猜错。", "在需要完整归属时，再经明确授权处理加密聊天数据库或做人工复核。"],
    relation: "本地盘点结果", originalState: "完整清单留在本机工作区，不对公网发布", translation: "不适用"
  }
];

const topicOrder = ["全部", "买方投顾", "RIA经营", "AI与顾问", "平台与并购", "服务与定价", "投资哲学", "整理进度"];
const statusLabels = { confirmed: "群聊确认", local: "本地原件", recovered: "官网恢复", expanded: "延展补充" };
let activeTopic = "全部";

const grid = document.querySelector("#resource-grid");
const search = document.querySelector("#search");
const statusFilter = document.querySelector("#status-filter");
const filters = document.querySelector("#filters");
const resultCount = document.querySelector("#result-count");
const dialog = document.querySelector("#resource-dialog");
const dialogContent = document.querySelector("#dialog-content");

topicOrder.forEach(topic => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = topic;
  button.className = topic === activeTopic ? "active" : "";
  button.addEventListener("click", () => {
    activeTopic = topic;
    [...filters.children].forEach(item => item.classList.toggle("active", item === button));
    renderResources();
  });
  filters.append(button);
});

function priorityStatus(item) {
  return ["confirmed", "recovered", "local", "expanded"].find(status => item.statuses.includes(status)) || "expanded";
}

function escapeHtml(value = "") {
  return value.replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
}

function renderResources() {
  const term = search.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const visible = resources.filter(item => {
    const haystack = [item.title,item.original,item.source,item.topic,item.summary,...item.takeaways,...item.yingmi].join(" ").toLowerCase();
    return (activeTopic === "全部" || item.topic === activeTopic)
      && (selectedStatus === "all" || item.statuses.includes(selectedStatus))
      && (!term || haystack.includes(term));
  });
  resultCount.textContent = visible.length;
  if (!visible.length) {
    grid.innerHTML = '<div class="empty">没有找到匹配材料。试试更宽的主题或关键词。</div>';
    return;
  }
  grid.innerHTML = visible.map(item => {
    const status = priorityStatus(item);
    const chips = item.metrics.slice(0,2).map(([value,label]) => `<span><b>${escapeHtml(value)}</b> ${escapeHtml(label)}</span>`).join("");
    return `<article class="resource-card" tabindex="0" role="button" data-id="${item.id}" style="--accent:${item.accent}">
      <div class="card-top"><span class="source-badge">${statusLabels[status]}</span><time>${item.date}</time></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="original-title">${escapeHtml(item.original)} · ${escapeHtml(item.source)}</p>
      <p class="card-summary">${escapeHtml(item.summary)}</p>
      <div class="card-metrics">${chips}</div>
      <div class="card-foot"><b>${escapeHtml(item.topic)}</b><span>${escapeHtml(item.pages)} ↗</span></div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".resource-card").forEach(card => {
    card.addEventListener("click", () => openResource(card.dataset.id));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openResource(card.dataset.id); }
    });
  });
}

function openResource(id) {
  const item = resources.find(resource => resource.id === id);
  if (!item) return;
  const status = priorityStatus(item);
  const metricBlocks = item.metrics.map(([value,label]) => `<div><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`).join("");
  const sourceActions = [
    item.sourceUrl ? `<a href="${item.sourceUrl}" target="_blank" rel="noopener">打开官方原始材料 ↗</a>` : "",
    item.secondaryUrl ? `<a href="${item.secondaryUrl}" target="_blank" rel="noopener">相关官方材料 ↗</a>` : "",
    !item.sourceUrl ? `<span>原件仅在本机私有索引中</span>` : ""
  ].join("");
  dialogContent.innerHTML = `<header class="dialog-hero" style="--accent:${item.accent}">
    <span class="source-badge">${statusLabels[status]} · ${escapeHtml(item.source)}</span>
    <h2>${escapeHtml(item.title)}</h2>
    <p class="original-title">${escapeHtml(item.original)}</p>
    <div class="dialog-meta"><span>${item.date}</span><span>${escapeHtml(item.topic)}</span><span>${escapeHtml(item.pages)}</span><span>${escapeHtml(item.translation)}</span></div>
  </header>
  <div class="dialog-body" style="--accent:${item.accent}">
    <div class="tabbar" role="tablist">
      <button class="active" type="button" data-tab="read">中文精读</button>
      <button type="button" data-tab="yingmi">盈米启示</button>
      <button type="button" data-tab="source">原始材料</button>
    </div>
    <section class="tab-panel" data-panel="read">
      <p>${escapeHtml(item.summary)}</p>
      <div class="insight-list">${metricBlocks}</div>
      <h4>关键发现</h4>
      <ul>${item.takeaways.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
    </section>
    <section class="tab-panel" data-panel="yingmi" hidden>
      <h4>对盈米 / 且慢的启示</h4>
      <ul>${item.yingmi.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
      <p class="boundary">这里是基于报告证据的分析建议，不代表公司已决策或已上线。</p>
    </section>
    <section class="tab-panel" data-panel="source" hidden>
      <h4>证据关系</h4><p>${escapeHtml(item.relation)}</p>
      <h4>原件状态</h4><p>${escapeHtml(item.originalState)}</p>
      <h4>翻译状态</h4><p>${escapeHtml(item.translation)}</p>
      <div class="source-actions">${sourceActions}</div>
      <p class="boundary">公开页只链接发布机构原始入口。内部原件、受限材料与微信聊天截图没有上传。</p>
    </section>
  </div>`;
  dialogContent.querySelectorAll(".tabbar button").forEach(button => {
    button.addEventListener("click", () => {
      dialogContent.querySelectorAll(".tabbar button").forEach(item => item.classList.toggle("active", item === button));
      dialogContent.querySelectorAll(".tab-panel").forEach(panel => panel.hidden = panel.dataset.panel !== button.dataset.tab);
    });
  });
  dialog.showModal();
}

dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
search.addEventListener("input", renderResources);
statusFilter.addEventListener("change", renderResources);

const focusToggle = document.querySelector("#focus-toggle");
focusToggle.addEventListener("click", () => {
  const active = document.body.classList.toggle("focus-mode");
  focusToggle.setAttribute("aria-pressed", String(active));
  focusToggle.textContent = active ? "退出专注" : "专注模式";
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); revealObserver.unobserve(entry.target); }
  });
}, { threshold: .08 });
document.querySelectorAll(".reveal").forEach(node => revealObserver.observe(node));

const canvas = document.querySelector("#signal-field");
const context = canvas.getContext("2d");
let nodes = [];
let pointer = { x: -1000, y: -1000 };
function resetField() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  context.setTransform(dpr,0,0,dpr,0,0);
  const count = Math.min(78, Math.max(32, Math.floor(innerWidth / 18)));
  nodes = Array.from({length:count}, () => ({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.16,vy:(Math.random()-.5)*.16,r:Math.random()*1.4+.5}));
}
function drawField() {
  context.clearRect(0,0,innerWidth,innerHeight);
  nodes.forEach((node,index) => {
    node.x += node.vx; node.y += node.vy;
    if (node.x < -20) node.x = innerWidth + 20; if (node.x > innerWidth + 20) node.x = -20;
    if (node.y < -20) node.y = innerHeight + 20; if (node.y > innerHeight + 20) node.y = -20;
    const pd = Math.hypot(node.x-pointer.x,node.y-pointer.y);
    if (pd < 160) { node.x += (node.x-pointer.x)/Math.max(pd,1)*.18; node.y += (node.y-pointer.y)/Math.max(pd,1)*.18; }
    context.beginPath(); context.arc(node.x,node.y,node.r,0,Math.PI*2); context.fillStyle="rgba(107,218,255,.46)"; context.fill();
    for (let j=index+1;j<nodes.length;j++) {
      const other=nodes[j], distance=Math.hypot(node.x-other.x,node.y-other.y);
      if (distance < 115) { context.beginPath();context.moveTo(node.x,node.y);context.lineTo(other.x,other.y);context.strokeStyle=`rgba(93,173,220,${.08*(1-distance/115)})`;context.stroke(); }
    }
  });
  requestAnimationFrame(drawField);
}
addEventListener("resize", resetField);
addEventListener("pointermove", event => pointer={x:event.clientX,y:event.clientY});
resetField(); drawField(); renderResources();
