(() => {
  "use strict";

  const requestedScope = document.currentScript?.dataset.clairAccessScope === "report"
    ? "report"
    : "workspace";
  const profiles = {
    workspace: {
      sessionKey: "clair-ai-studio-access-v1",
      sessionValue: "verified-2026-08-28",
      salt: "pSPWbcuWBb/A+MHgQ+J+Cg==",
      expectedHash: "RvAEQHpDP8wpmqGyQH1aO9zAJnQAjzfRUJ3mK+CsoCA=",
      brandLabel: "PRIVATE WORKSPACE",
      title: "Clair's Studio",
      intro: "这是一个私人工作台，请输入访问密码。",
      fieldLabel: "访问密码",
      foot: "Protected access · This tab only",
      ariaLabel: "Clair's Studio 访问验证",
    },
    report: {
      sessionKey: "clair-ai-studio-report-access-v1",
      sessionValue: "verified-report-2026-08-28",
      salt: "bl87Yx//mn6Eic8JnQQCig==",
      expectedHash: "/s6AtNLOOg/tbXREQlM0Q+wtXiJeXCj7n+aijwbTTAQ=",
      brandLabel: "PRIVATE REPORT",
      title: "Clair's Report",
      intro: "这是 Clair's Studio 私密报告，请输入报告密码。",
      fieldLabel: "报告密码",
      foot: "Protected report · This tab only",
      ariaLabel: "Clair's Studio 报告访问验证",
    },
  };
  const profile = profiles[requestedScope];
  const SESSION_KEY = profile.sessionKey;
  const SESSION_VALUE = profile.sessionValue;
  const ITERATIONS = 310000;
  const SALT = profile.salt;
  const EXPECTED_HASH = profile.expectedHash;
  const ROOT_CLASS = "clair-site-access-locked";
  const HOST_ID = "clair-site-access-gate";

  const readSession = () => {
    try {
      return window.sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  };

  if (readSession() === SESSION_VALUE) return;

  document.documentElement.classList.add(ROOT_CLASS);

  const concealment = document.createElement("style");
  concealment.id = "clair-site-access-concealment";
  concealment.textContent = `
    html.${ROOT_CLASS} { overflow: hidden !important; background: #f2f1ed !important; }
    html.${ROOT_CLASS} body > :not(#${HOST_ID}) { visibility: hidden !important; }
    #${HOST_ID} { visibility: visible !important; }
  `;
  document.head.append(concealment);

  const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

  const sameBytes = (left, right) => {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
    return difference === 0;
  };

  const verifyPassword = async (password) => {
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: fromBase64(SALT),
        iterations: ITERATIONS,
      },
      material,
      256,
    );
    return sameBytes(new Uint8Array(bits), fromBase64(EXPECTED_HASH));
  };

  const unlock = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, SESSION_VALUE);
    } catch {
      // The current page still unlocks even when storage is unavailable.
    }
    document.documentElement.classList.remove(ROOT_CLASS);
    document.getElementById(HOST_ID)?.remove();
    concealment.remove();
    window.dispatchEvent(new CustomEvent("clair-site-access-granted"));
  };

  const mountGate = () => {
    if (readSession() === SESSION_VALUE) {
      unlock();
      return;
    }
    if (document.getElementById(HOST_ID)) return;

    const host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("role", "dialog");
    host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-label", profile.ariaLabel);
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: grid;
          place-items: center;
          overflow: auto;
          padding: 24px;
          background:
            radial-gradient(circle at 18% 12%, rgb(103 134 220 / 22%), transparent 30%),
            radial-gradient(circle at 82% 86%, rgb(211 157 88 / 20%), transparent 27%),
            #f2f1ed;
          color: #18202a;
          font-family: Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
          box-sizing: border-box;
        }
        * { box-sizing: border-box; }
        .card {
          width: min(590px, 100%);
          padding: clamp(38px, 7vw, 64px);
          border: 1px solid rgb(255 255 255 / 82%);
          border-radius: 30px;
          background: rgb(255 255 255 / 82%);
          box-shadow: 0 36px 110px rgb(32 39 54 / 14%), inset 0 1px 0 #fff;
          backdrop-filter: blur(24px) saturate(1.15);
        }
        .brand { display: flex; align-items: center; gap: 12px; color: #858b95; font-size: 10px; font-weight: 750; letter-spacing: .18em; }
        .mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; background: linear-gradient(145deg, #1d1e22, #383a42); color: #fff; font: italic 20px Georgia, serif; box-shadow: 0 12px 30px rgb(23 24 28 / 16%); }
        h1 { margin: 54px 0 12px; font: 500 clamp(42px, 8vw, 66px)/1 Georgia, "Times New Roman", serif; letter-spacing: -.055em; }
        .intro { margin: 0 0 40px; color: #707681; font-size: 15px; line-height: 1.7; }
        label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
        .password-row { display: flex; gap: 8px; padding: 5px; border: 1px solid #dfe2e8; border-radius: 14px; background: rgb(255 255 255 / 90%); box-shadow: 0 8px 24px rgb(30 32 42 / 5%); }
        .password-row:focus-within { border-color: #aeb2ff; box-shadow: 0 0 0 4px rgb(91 98 244 / 9%); }
        input { width: 100%; min-width: 0; height: 46px; border: 0; outline: 0; padding: 0 14px; background: transparent; color: #18202a; font: inherit; letter-spacing: .08em; }
        input::placeholder { color: #9ba1a9; letter-spacing: 0; }
        button { width: 46px; height: 46px; flex: 0 0 46px; border: 0; border-radius: 10px; background: #18202a; color: #fff; font: 22px/1 inherit; cursor: pointer; box-shadow: 0 8px 20px rgb(24 32 42 / 16%); }
        button:hover { background: #2b3644; transform: translateY(-1px); }
        button:disabled { cursor: wait; opacity: .58; transform: none; }
        .error { min-height: 20px; margin: 10px 4px 0; color: #b4232d; font-size: 13px; }
        .foot { margin-top: 24px; color: #9297a0; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
        .foot::before { content: "\u25cf"; margin-right: 7px; color: #6c72f6; }
        @media (max-width: 520px) {
          :host { padding: 14px; }
          .card { padding: 34px 26px; border-radius: 24px; }
          h1 { margin-top: 42px; }
        }
        @media (prefers-reduced-motion: reduce) { button { transition: none; } }
      </style>
      <main class="card">
        <div class="brand"><span class="mark">C</span><span>${profile.brandLabel}</span></div>
        <h1>${profile.title}</h1>
        <p class="intro">${profile.intro}</p>
        <form novalidate>
          <label for="clair-access-password">${profile.fieldLabel}</label>
          <div class="password-row">
            <input id="clair-access-password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="${profile.fieldLabel}" autofocus />
            <button type="submit" aria-label="验证并进入">→</button>
          </div>
          <p class="error" role="alert" aria-live="polite"></p>
        </form>
        <div class="foot">${profile.foot}</div>
      </main>
    `;

    document.body.append(host);
    const form = shadow.querySelector("form");
    const input = shadow.querySelector("input");
    const button = shadow.querySelector("button");
    const error = shadow.querySelector(".error");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = input.value;
      error.textContent = "";
      button.disabled = true;
      input.disabled = true;
      try {
        if (await verifyPassword(password)) {
          input.value = "";
          unlock();
          return;
        }
        error.textContent = "密码不正确，请再试一次";
      } catch {
        error.textContent = "当前浏览器无法完成验证，请升级后重试";
      }
      button.disabled = false;
      input.disabled = false;
      input.select();
      input.focus();
    });

    requestAnimationFrame(() => input.focus());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(mountGate), { once: true });
  } else {
    requestAnimationFrame(mountGate);
  }
})();
