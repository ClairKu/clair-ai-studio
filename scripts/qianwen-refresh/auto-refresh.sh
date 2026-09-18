#!/bin/zsh
# 千问看板一键/定时刷新：取数 → 整理 → 组装校验 → 加密构建 → 推送 → 校验上线。
# 由 launchd（com.clair.qianwen-auto-refresh）每日 09:30/17:30 调起；也可手动 zsh 本脚本。
# 所有子脚本都从 origin/main 的临时 worktree 取，避免主克隆落后带来的旧版脚本问题；
# 一律用显式解释器调用——API 推送不保留可执行位，不能依赖 chmod。
set -u
source ~/.zshrc 2>/dev/null
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
REPO="${QW_REPO_DIR:-$HOME/AI/clair-ai-studio}"   # 本地克隆路径；QW_REPO 留给 api-push.py 表示 owner/name，勿混用
BASE="$HOME/Library/Application Support/Clair AI Studio/qianwen-refresh"
LOGDIR="$HOME/Library/Logs/Clair AI Studio/qianwen-refresh"
TS=$(date +%Y%m%d-%H%M%S); WORK="$BASE/runs/$TS"
mkdir -p "$WORK" "$LOGDIR"; LOG="$LOGDIR/$TS.log"; ln -sfn "$LOG" "$LOGDIR/latest.log"
exec > >(tee -a "$LOG") 2>&1
echo "== 千问看板自动刷新 $TS =="
STATUS="$BASE/status.json"; COMMIT=""; CUT=""; AD=""

write_status() { # <ok> <msg>
  python3 - "$1" "$2" "$TS" "$CUT" "$AD" "$COMMIT" "$STATUS" <<'PY'
import json, sys, datetime
ok, msg, ts, cut, ad, commit, path = sys.argv[1:]
json.dump({"ok": ok == "1", "run": ts, "finished_at": datetime.datetime.now().isoformat(timespec="seconds"),
           "data_cutoff": cut, "asset_as_of": ad, "commit": commit, "message": msg},
          open(path, "w"), ensure_ascii=False, indent=2)
PY
}
cleanup() {
  for w in "$WORK/wt" "$WORK/src"; do rm -f "$w/node_modules"; git -C "$REPO" worktree remove --force "$w" 2>/dev/null; done
  git -C "$REPO" worktree prune 2>/dev/null
  rmdir "$BASE/.lock" 2>/dev/null
  ls -1dt "$BASE"/runs/* 2>/dev/null | tail -n +11 | xargs rm -rf 2>/dev/null
}
fail() {
  echo "FAIL: $1"; write_status 0 "$1"
  osascript -e "display notification \"$1\" with title \"千问看板自动刷新失败\" subtitle \"$TS\"" 2>/dev/null
  cleanup; exit 1
}
mkdir "$BASE/.lock" 2>/dev/null || { echo "另一轮刷新仍在进行，跳过"; exit 0; }
trap cleanup EXIT

# ── 前置 ──
[ -n "${REDASH_API_KEY:-}" ] || fail "缺 REDASH_API_KEY（~/.zshrc）"
gh auth token >/dev/null 2>&1 || fail "gh 未登录，无法推送"
cd "$REPO" || fail "仓库不存在 $REPO"
fetch_once() {  # 90s 看门狗：这台机器上 github 443 会半开挂死，不能裸 fetch
  git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=30 fetch origin main >/dev/null 2>&1 &
  local pid=$!; local i=0
  while kill -0 $pid 2>/dev/null; do sleep 3; i=$((i+3)); [ $i -ge 90 ] && { kill -9 $pid 2>/dev/null; return 1; }; done
  wait $pid
}
ok=0; for i in 1 2 3 4; do fetch_once && ok=1 && break; sleep 8; done
[ $ok -eq 1 ] || fail "git fetch origin main 连续失败（网络/SNI）"
git worktree add --detach "$WORK/src" origin/main >/dev/null 2>&1 || fail "建 src worktree 失败"
ln -sfn "$REPO/node_modules" "$WORK/src/node_modules"
S="$WORK/src/scripts/qianwen-refresh"
echo "scripts @ $(git -C "$WORK/src" rev-parse --short HEAD)"

# ── 取数 ──
AD=$(python3 "$S/pick-asset-date.py") || fail "资产快照日判定失败（redash 不可达？）"
CUT="$(date '+%Y-%m-%d %H:%M:%S')"; echo "$CUT" > "$WORK/cut.txt"; echo "$AD" > "$WORK/ad.txt"
echo "CUT=$CUT AD=$AD"
QW_CUT="$CUT" QW_AD="$AD" zsh "$S/run-sql.sh" > "$WORK/sql-raw.txt" 2>&1 || fail "6 段取数失败：$(tail -1 "$WORK/sql-raw.txt")"
grep -q "### 6 province" "$WORK/sql-raw.txt" || fail "6 段取数不完整"
QW_CUT="$CUT" QW_AD="$AD" QW_WORK="$WORK" zsh "$S/run-ext-sql.sh" || fail "扩展取数失败"

# ── 整理 / 组装 ──
git -C "$WORK/src" show HEAD:public/reports/qianwen-user-acquisition-dashboard/data/latest.json > "$WORK/template.json"
out=$(python3 "$S/build-q.py" "$WORK" 2>&1) || fail "build-q 整理失败：$(echo "$out" | tail -1)"; echo "$out" | tail -2
out=$(python3 "$S/assemble.py" "$WORK/template.json" "$WORK" 2>&1) || fail "assemble 校验失败：$(echo "$out" | tail -1)"; echo "$out" | tail -2

# ── 构建 + 提交（replay.sh 会在 $WORK/wt 建 worktree、npm run build、只提交 3 个文件）──
QW_WORK="$WORK" zsh "$S/replay.sh" || fail "replay/build 失败"

# ── 推送（远端被并行会话推进就重取 head 再推）──
pushed=0
for i in 1 2 3 4 5 6; do
  git ls-remote origin main 2>/dev/null | cut -f1 > "$WORK/base-sha.txt"
  out=$(QW_REPO=clairku/clair-ai-studio QW_WT="$WORK/wt" python3 "$S/api-push.py" 2>&1); echo "$out" | tail -3
  if echo "$out" | grep -q "^DONE"; then pushed=1; COMMIT=$(echo "$out" | grep "^ref ->" | awk '{print $3}'); break; fi
  sleep 10
done
[ $pushed -eq 1 ] || fail "推送失败（6 次）"

# ── 等 Pages 生效（最多 12 分钟；超时只告警不算失败）──
URL="https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/"
LOCAL="$WORK/wt/docs/reports/qianwen-user-acquisition-dashboard/index.html"
live=0
for i in $(seq 1 36); do
  curl -s --max-time 25 "$URL?v=$(date +%s)" -o "$WORK/live.html" && cmp -s "$WORK/live.html" "$LOCAL" && live=1 && break
  sleep 20
done
msg="已发布 $COMMIT，数据截至 $CUT，资产快照 $AD"
[ $live -eq 1 ] && echo "LIVE_OK" || msg="$msg（Pages 尚未生效，稍后自动传播）"
write_status 1 "$msg"; echo "DONE: $msg"
