(function () {
  const isQiemanAiPracticeReport = (source) =>
    source.includes("<title>盈米 AI 产品实践｜且慢产品团队｜2026.07.30</title>");

  const navigation = `
      <nav class="nav-links" aria-label="报告导航">
        <a href="#blueprint">总体蓝图</a><a href="#architecture">能力架构</a><a href="#roles">产品角色</a><a href="#global-plan">小顾演进</a><a href="#distribution">开放分发</a><a href="#demo">小顾演示</a><a href="#advisor-demo">投顾工作台</a><a href="#value">三端结果</a><a href="#evidence">规模验证</a><a href="#governance">治理</a><a href="#collaboration">合作路径</a><a href="#roadmap">路线图</a>
      </nav>`;

  const styles = `
  <style id="report-template-v2">
    *{font-family:"Songti SC","STSong","SimSun",serif!important}
    html{scroll-behavior:smooth;scroll-padding-top:84px;scroll-snap-type:y proximity}
    body{font-family:"Songti SC","STSong","SimSun",serif;font-size:16px}
    .nav-shell{background:rgba(245,246,249,.9);backdrop-filter:blur(22px);border-bottom:1px solid rgba(113,88,232,.12);box-shadow:0 8px 30px rgba(40,48,68,.045)}
    .brand{border-radius:14px;padding:4px 7px 4px 4px;transition:.2s}
    .brand:hover,.brand:focus-visible{background:#fff;box-shadow:0 8px 24px rgba(40,48,68,.08)}
    .brand-mark{font-family:"Songti SC","STSong","SimSun",serif!important}
    .nav-links{scrollbar-width:none;overscroll-behavior-inline:contain;scroll-snap-type:x proximity}
    .nav-links::-webkit-scrollbar{display:none}
    .nav-links a{scroll-snap-align:center;transition:.2s}
    .nav-links a:hover,.nav-links a.active{box-shadow:0 6px 18px rgba(60,47,125,.08)}
    .nav-links a.active{font-weight:900}
    .hero,.section,.closing{scroll-snap-align:start;scroll-snap-stop:normal}
    .hero{min-height:calc(100svh - 68px)}
    .section{min-height:calc(100svh - 68px);display:flex;align-items:center;position:relative}
    .section>.wrap{width:100%}
    .section:before{content:"";position:absolute;inset:0 auto auto 50%;width:min(1136px,calc(100% - 56px));height:1px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(113,88,232,.16),transparent)}
    .section.white+.section.white:before{background:linear-gradient(90deg,transparent,rgba(21,33,60,.12),transparent)}
    .thesis,.roles,.trinity,.business-grid,.roadmap,.blueprint-readout,.promise-grid,.channel-modes,.collaboration-grid,.gov-list,.trend-insights,.platform-access-modes{align-items:stretch;grid-auto-rows:1fr}
    .thesis>*,.roles>*,.trinity>*,.business-grid>*,.roadmap>*,.blueprint-readout>*,.promise-grid>*,.channel-modes>*,.collaboration-grid>*,.gov-list>*,.trend-insights>*,.platform-access-modes>*{height:100%}
    a:focus-visible,button:focus-visible{outline:3px solid rgba(113,88,232,.32);outline-offset:3px}
    .back-to-top{position:fixed;right:22px;bottom:22px;z-index:70;display:flex;align-items:center;gap:7px;min-height:44px;padding:0 15px;border:1px solid rgba(113,88,232,.18);border-radius:999px;background:rgba(255,255,255,.94);color:#7158e8;font-size:12px;font-weight:900;box-shadow:0 14px 38px rgba(40,48,68,.14);backdrop-filter:blur(16px);opacity:0;pointer-events:none;transform:translateY(12px);transition:.22s}
    .back-to-top.visible{opacity:1;pointer-events:auto;transform:none}
    .back-to-top:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(40,48,68,.18)}
    @media(max-width:1500px){.status{display:none}}
    @media(max-width:720px){
      html{scroll-padding-top:118px}
      .nav{height:auto;min-height:68px;padding:8px 16px 10px;flex-wrap:wrap;gap:7px 12px}
      .brand{min-width:0}
      .brand>span:last-child{overflow:hidden;text-overflow:ellipsis}
      .nav-links{display:flex;order:3;width:calc(100% + 32px);margin:0 -16px;padding:0 16px 2px}
      .nav-links a{padding:7px 10px}
      .hero,.section{min-height:calc(100svh - 112px)}
      .section:before{width:calc(100% - 32px)}
      .back-to-top{right:14px;bottom:14px}
      .back-to-top span{display:none}
    }
    @media(prefers-reduced-motion:reduce){
      html{scroll-behavior:auto;scroll-snap-type:none}
      .back-to-top{transition:none}
    }
    @media print{
      html{scroll-snap-type:none}
      .back-to-top{display:none}
    }
  </style>`;

  const runtime = `
  <script id="report-template-v2-runtime">
    (() => {
      const backToTop = document.getElementById("backToTop");
      let activeChapter = "";
      const syncTemplateUi = () => {
        backToTop?.classList.toggle("visible", scrollY > innerHeight * .65);
        const active = document.querySelector(".nav-links a.active");
        if (active?.hash && active.hash !== activeChapter) {
          activeChapter = active.hash;
          active.scrollIntoView({ block:"nearest", inline:"center" });
        }
        document.querySelectorAll(".nav-links a").forEach((link) => {
          if (link.classList.contains("active")) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      };
      addEventListener("scroll", syncTemplateUi, { passive:true });
      syncTemplateUi();
    })();
  </script>`;

  globalThis.enhanceReportTemplate = (source) => {
    if (!isQiemanAiPracticeReport(source)) return source;

    let enhanced = source
      .replace(/font-size:(?:6|7|8|9|10|11)px/g, "font-size:12px")
      .replace(/font:(\d+\s+)?(?:6|7|8|9|10|11)px/g, "font:$1" + "12px")
      .replace(/font-size="(?:6|7|8|9|10|11)"/g, 'font-size="12"')
      .replace("context.font = '10px Songti SC, STSong, serif'", "context.font = '12px Songti SC, STSong, SimSun, serif'")
      .replace(
        '<a class="brand" href="#top"><span class="brand-mark">YM</span><span>盈米 AI<small>QIEMAN PRODUCT TEAM</small></span></a>',
        '<a class="brand" href="#top" aria-label="返回报告顶部" title="返回顶部"><span class="brand-mark">YM</span><span>盈米 AI<small>点击返回顶部</small></span></a>',
      )
      .replace(/<nav class="nav-links" aria-label="报告导航">[\s\S]*?<\/nav>/, navigation)
      .replace("</head>", `${styles}</head>`)
      .replace(
        '<footer class="closing">',
        '<a class="back-to-top" id="backToTop" href="#top" aria-label="返回报告顶部">↑ <span>顶部</span></a><footer class="closing">',
      )
      .replace("</body>", `${runtime}</body>`);

    return enhanced;
  };
})();
