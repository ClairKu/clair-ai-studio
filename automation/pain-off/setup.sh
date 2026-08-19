#!/usr/bin/env bash
#
# 痛点消消乐 · 一键搭建
#
# 在你自己的终端里跑（脚本是交互式的，会问你要 token、让你确认数字）：
#
#   bash automation/pain-off/setup.sh
#
# 它按顺序完成 README 里的全部搭建步骤，每步可跳过、可重跑（幂等）：
#   1. 校验 GitLab token（没有就现场提示去建）
#   2. 解析并确认 roster 的 gitlab_username
#   3. 试算一次（--dry-run），你确认数字后首发快照到公网
#   4. 安装 launchd 定时快照（每天 9:10 / 13:10 / 18:10 自动更新）
#   5. （可选）部署 Cloudflare 中继 Worker —— 公网页面「点一下就实时重算」
#   6. 把 Worker 地址写进 relay-config.json 并经 GitHub API 发布
#   7. 安装 launchd 常驻 agent（接住公网的刷新请求）
#
# 前置：这台 Mac 能连内网 GitLab（git.frontnode.net）；gh 已登录 GitHub。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PAIN="$ROOT/automation/pain-off"
NODE_BIN="$(command -v node)"
GITLAB_API="https://git.frontnode.net/api/v4"
JIRA_BASE="https://jira.yingmi-inc.com"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
STATE_DIR="$PAIN/state"
RELAY_CONFIG_REL="reports/product-demand-pulse/data/relay-config.json"

cd "$ROOT"
mkdir -p "$STATE_DIR"

say()  { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
info() { printf '   %s\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
ask_yn() { local yn; read -rp "$1 [y/N] " yn; [[ "$yn" == [yY]* ]]; }

# ---------- 0. 前置检查 ----------
say "前置检查"
[[ -n "$NODE_BIN" ]] || die "找不到 node"
gh auth token >/dev/null 2>&1 || die "gh 未登录（发布快照要用 GitHub API）：先 gh auth login"
code="$(curl -s -m 8 -o /dev/null -w '%{http_code}' "$GITLAB_API/version" || true)"
[[ "$code" == "401" || "$code" == "200" ]] || die "连不上内网 GitLab（$GITLAB_API → $code）。挂上 VPN 再跑。"
info "node: $NODE_BIN"
info "GitLab 可达（HTTP $code）、gh 已登录"

# ---------- 1. GitLab token ----------
say "1/7 GitLab token（read_api 只读）"
if [[ -z "${GIT_ACCESS_TOKEN:-}" && -f "$STATE_DIR/git-token" ]]; then
  GIT_ACCESS_TOKEN="$(cat "$STATE_DIR/git-token")"
  info "已从 state/git-token 读到上次保存的 token"
fi
while :; do
  if [[ -z "${GIT_ACCESS_TOKEN:-}" ]]; then
    echo "   去 https://git.frontnode.net/-/user_settings/personal_access_tokens 建一个"
    echo "   scope 只勾 read_api 的 token，然后粘贴到这里："
    read -rsp "   GIT_ACCESS_TOKEN: " GIT_ACCESS_TOKEN; echo
  fi
  gl_user="$(curl -s -m 10 -H "PRIVATE-TOKEN: $GIT_ACCESS_TOKEN" "$GITLAB_API/user" | "$NODE_BIN" -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.username||"")}catch{}})' || true)"
  [[ -n "$gl_user" ]] && break
  echo "   ✗ token 无效或权限不足，重来。"; GIT_ACCESS_TOKEN=""
done
export GIT_ACCESS_TOKEN
printf '%s' "$GIT_ACCESS_TOKEN" > "$STATE_DIR/git-token"; chmod 600 "$STATE_DIR/git-token"
info "✓ token 有效（GitLab 账号：$gl_user），已存 state/git-token（不入库）"

# Jira token 可选：配了「上线单（YR）」一栏才有内容
if [[ -z "${JIRA_TOKEN:-}" && -f "$STATE_DIR/jira-token" ]]; then
  JIRA_TOKEN="$(cat "$STATE_DIR/jira-token")"
fi
if [[ -z "${JIRA_TOKEN:-}" ]]; then
  read -rsp "   （可选）JIRA_TOKEN（$JIRA_BASE 的 PAT，回车跳过）: " JIRA_TOKEN; echo
fi
if [[ -n "${JIRA_TOKEN:-}" ]]; then
  jcode="$(curl -s -m 10 -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $JIRA_TOKEN" "$JIRA_BASE/rest/api/2/myself" || true)"
  if [[ "$jcode" == "200" ]]; then
    export JIRA_TOKEN
    printf '%s' "$JIRA_TOKEN" > "$STATE_DIR/jira-token"; chmod 600 "$STATE_DIR/jira-token"
    info "✓ Jira token 有效，已存 state/jira-token"
  else
    info "✗ Jira token 校验失败（HTTP $jcode），本次忽略——「上线单」一栏会留空"
    JIRA_TOKEN=""
  fi
else
  info "跳过 Jira token——追溯里「上线单」一栏会留空"
fi

# ---------- 2. roster ----------
say "2/7 人员名册（gitlab_username）"
missing() { "$NODE_BIN" -e '
  const r=require("'"$PAIN"'/config/roster.json");
  const m=r.people.filter(p=>!p.gitlab_username).map(p=>p.display_name);
  process.stdout.write(m.join("、"));'; }
while [[ -n "$(missing)" ]]; do
  info "还有人没确认 username：$(missing)"
  info "跑解析器给你候选（只读查询，不写回）……"
  "$NODE_BIN" "$PAIN/resolve-roster.mjs" || true
  echo
  echo "   ↑ 按候选人工确认后，把 username 填进 automation/pain-off/config/roster.json"
  echo "     （认错人比没数字更糟，所以这一步必须人来敲定）"
  read -rp "   填好并保存后回车重新检查（Ctrl-C 退出）… " _
done
info "✓ roster 已齐"

# ---------- 3. 试算 + 首发 ----------
say "3/7 试算（--dry-run，不写盘不发布）"
"$NODE_BIN" "$PAIN/refresh.mjs" --dry-run
echo
if ask_yn "   数字对得上吗？确认就写盘并首发快照到公网"; then
  "$NODE_BIN" "$PAIN/refresh.mjs" --publish
  info "✓ 已发布。1–2 分钟后打开看板核对：https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/"
else
  info "跳过发布。改完口径（config/rules.json）后重跑本脚本即可。"
fi

# ---------- plist 安装工具 ----------
install_plist() { # $1=模板 $2=目标Label
  local tpl="$PAIN/launchd/$1" dst="$LAUNCH_DIR/$1"
  NODE_BIN="$NODE_BIN" TPL="$tpl" DST="$dst" \
  GIT_ACCESS_TOKEN="$GIT_ACCESS_TOKEN" JIRA_TOKEN="${JIRA_TOKEN:-}" \
  WORKER_URL="${WORKER_URL:-}" AGENT_TOKEN="${AGENT_TOKEN:-}" \
  python3 - <<'PY'
import os, plistlib
with open(os.environ["TPL"], "rb") as f:
    p = plistlib.load(f)
p["ProgramArguments"][0] = os.environ["NODE_BIN"]
env = p["EnvironmentVariables"]
env["GIT_ACCESS_TOKEN"] = os.environ["GIT_ACCESS_TOKEN"]
if os.environ.get("JIRA_TOKEN"):
    env["JIRA_TOKEN"] = os.environ["JIRA_TOKEN"]
env["PAIN_OFF_WORKER_URL"] = os.environ.get("WORKER_URL", "")
env["PAIN_OFF_AGENT_TOKEN"] = os.environ.get("AGENT_TOKEN", "")
with open(os.environ["DST"], "wb") as f:
    plistlib.dump(p, f)
PY
  chmod 600 "$dst"
  launchctl unload "$dst" >/dev/null 2>&1 || true
  launchctl load -w "$dst"
  info "✓ 已装载 $1（token 明文写在 $dst，权限 600）"
}

# ---------- 4. 定时快照 ----------
say "4/7 launchd 定时快照（每天 9:10 / 13:10 / 18:10）"
if ask_yn "   安装/更新定时任务？"; then
  install_plist com.clair.pain-off.schedule.plist
else
  info "跳过"
fi

# ---------- 5. 中继 Worker（可选，实时那一半） ----------
say "5/7 Cloudflare 中继 Worker（公网点更新 → 内网实时重算）"
WORKER_URL="${PAIN_OFF_WORKER_URL:-}"
if ask_yn "   现在部署 Worker？（要 Cloudflare 账号，wrangler 会弹浏览器授权）"; then
  cd "$ROOT/worker/pain-off-relay"
  [[ -d node_modules ]] || npm install --silent
  npx wrangler whoami >/dev/null 2>&1 || npx wrangler login
  if grep -q REPLACE_WITH_KV_NAMESPACE_ID wrangler.toml; then
    info "创建 KV namespace……"
    kv_out="$(npx wrangler kv namespace create PAIN_OFF 2>&1 | tee /dev/stderr)"
    kv_id="$(printf '%s' "$kv_out" | grep -oE '[0-9a-f]{32}' | head -1)"
    [[ -n "$kv_id" ]] || die "没能从输出里解析出 KV id，手动填进 wrangler.toml 再重跑"
    sed -i '' "s/REPLACE_WITH_KV_NAMESPACE_ID/$kv_id/" wrangler.toml
    info "✓ KV id 已写入 wrangler.toml：$kv_id"
  fi
  read -rp "   设定公网「更新数据」口令 PULSE_PASSCODE（访客要输的）: " PASSCODE
  [[ -n "$PASSCODE" ]] || die "口令不能为空"
  printf '%s' "$PASSCODE" | npx wrangler secret put PULSE_PASSCODE
  if [[ -f "$STATE_DIR/agent-token" ]]; then
    AGENT_TOKEN="$(cat "$STATE_DIR/agent-token")"
  else
    AGENT_TOKEN="$(openssl rand -hex 32)"
    printf '%s' "$AGENT_TOKEN" > "$STATE_DIR/agent-token"; chmod 600 "$STATE_DIR/agent-token"
  fi
  printf '%s' "$AGENT_TOKEN" | npx wrangler secret put AGENT_TOKEN
  deploy_out="$(npx wrangler deploy 2>&1 | tee /dev/stderr)"
  WORKER_URL="$(printf '%s' "$deploy_out" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1)"
  [[ -n "$WORKER_URL" ]] || die "部署输出里没找到 workers.dev 地址"
  h="$(curl -s -m 10 "$WORKER_URL/health" || true)"
  info "✓ Worker 已部署：$WORKER_URL（/health → ${h:-无响应}）"
  cd "$ROOT"
else
  info "跳过 Worker。看板仍每天自动更新，只是公网点「更新数据」只能拉最新已发布快照。"
fi

# ---------- 6. 回填 worker_base 并发布 ----------
if [[ -n "$WORKER_URL" ]]; then
  say "6/7 把 Worker 地址写进 relay-config.json 并发布"
  for d in public docs; do
    WORKER_URL="$WORKER_URL" "$NODE_BIN" -e '
      const fs=require("fs"),p="'"$ROOT/$d/$RELAY_CONFIG_REL"'";
      const j=JSON.parse(fs.readFileSync(p,"utf8"));
      j.worker_base=process.env.WORKER_URL;
      fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");'
  done
  info "本地两份 relay-config.json 已改，经 GitHub API 发布（不碰仓库其他文件）……"
  "$NODE_BIN" --input-type=module -e '
    import { readFileSync } from "node:fs";
    import { execFileSync } from "node:child_process";
    const token = execFileSync("gh", ["auth","token"]).toString().trim();
    const api = (m,p,b) => {
      const args=["-sS","--max-time","40","--resolve","api.github.com:443:140.82.113.6",
        "-X",m,"-H",`Authorization: Bearer ${token}`,"-H","Accept: application/vnd.github+json",
        "-w","\n%{http_code}",`https://api.github.com${p}`];
      if(b) args.push("-H","Content-Type: application/json","-d",JSON.stringify(b));
      const out=execFileSync("curl",args).toString();
      const i=out.lastIndexOf("\n"), s=Number(out.slice(i+1));
      if(s>=400) throw new Error(`${m} ${p} → ${s}: ${out.slice(0,300)}`);
      return out.slice(0,i)?JSON.parse(out.slice(0,i)):null;
    };
    const R="/repos/ClairKu/clair-ai-studio";
    const paths=["public/'"$RELAY_CONFIG_REL"'","docs/'"$RELAY_CONFIG_REL"'"];
    const content=readFileSync("'"$ROOT"'/public/'"$RELAY_CONFIG_REL"'","utf8");
    const ref=api("GET",`${R}/git/ref/heads/main`), head=ref.object.sha;
    const hc=api("GET",`${R}/git/commits/${head}`);
    const blob=api("POST",`${R}/git/blobs`,{content:Buffer.from(content).toString("base64"),encoding:"base64"});
    const tree=api("POST",`${R}/git/trees`,{base_tree:hc.tree.sha,tree:paths.map(p=>({path:p,mode:"100644",type:"blob",sha:blob.sha}))});
    const c=api("POST",`${R}/git/commits`,{message:"chore(pain-off): 启用实时中继，回填 worker_base",tree:tree.sha,parents:[head]});
    api("PATCH",`${R}/git/refs/heads/main`,{sha:c.sha});
    console.log("   ✓ 已发布 commit", c.sha.slice(0,8));'
  git fetch origin >/dev/null 2>&1 || true
else
  say "6/7 回填 worker_base——跳过（Worker 未部署）"
fi

# ---------- 7. 常驻 agent ----------
if [[ -n "$WORKER_URL" ]]; then
  say "7/7 launchd 常驻 agent（轮询中继、接刷新请求）"
  AGENT_TOKEN="${AGENT_TOKEN:-$(cat "$STATE_DIR/agent-token" 2>/dev/null || true)}"
  [[ -n "$AGENT_TOKEN" ]] || die "state/agent-token 不存在——先跑第 5 步"
  install_plist com.clair.pain-off.agent.plist
  # 定时任务也带上 Worker 地址，取完数顺手把快照推给中继
  install_plist com.clair.pain-off.schedule.plist
  sleep 2
  tail -3 /tmp/pain-off-agent.log 2>/dev/null || true
else
  say "7/7 常驻 agent——跳过（Worker 未部署）"
fi

say "完成"
info "看板：https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/"
info "定时：每天 9:10 / 13:10 / 18:10 自动取数发布（launchctl list | grep pain-off 查看）"
[[ -n "$WORKER_URL" ]] && info "实时：页面点「更新数据」→ 输口令 → 1–3 分钟内出新数（agent 日志 /tmp/pain-off-agent.log）"
info "重跑本脚本随时安全：每步幂等，token 已存 state/（不入库）。"
