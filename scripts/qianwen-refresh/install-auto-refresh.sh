#!/bin/zsh
# 安装/更新 launchd 定时任务 com.clair.qianwen-auto-refresh（每日 09:30 / 17:30）。
# 幂等；同时下掉从未跑通、且会把明文写回 docs/ 的旧按钮服务。
# 用法：zsh scripts/qianwen-refresh/install-auto-refresh.sh   （或 npm run install:qianwen-refresh）
set -eu
REPO="${QW_REPO:-$(cd "$(dirname "$0")/../.." && pwd)}"   # 从临时 worktree 里跑安装时用 QW_REPO 指向主克隆
LABEL=com.clair.qianwen-auto-refresh
OLD=com.clair.qianwen-user-acquisition-refresh
BASE="$HOME/Library/Application Support/Clair AI Studio/qianwen-refresh"
LOGDIR="$HOME/Library/Logs/Clair AI Studio/qianwen-refresh"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
UID_=$(id -u)
mkdir -p "$BASE/bin" "$LOGDIR" "$HOME/Library/LaunchAgents"

# 自更新引导：每次触发先从 origin/main 取最新 auto-refresh.sh 再执行，避免主克隆落后
cat > "$BASE/bin/bootstrap.sh" <<EOF
#!/bin/zsh
# launchd 入口：先尽力从 origin/main 取最新 auto-refresh.sh（每次 fetch 有 90s 看门狗，最多 3 次），
# 取不到就用上次缓存；无论如何都往下跑，不会卡死在网络上。
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
REPO="$REPO"; BASE="$BASE"
fetch_once() {
  git -C "\$REPO" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=30 fetch origin main >/dev/null 2>&1 &
  local pid=\$!; local i=0
  while kill -0 \$pid 2>/dev/null; do sleep 3; i=\$((i+3)); [ \$i -ge 90 ] && { kill -9 \$pid 2>/dev/null; return 1; }; done
  wait \$pid
}
for n in 1 2 3; do fetch_once && break; sleep 5; done
if git -C "\$REPO" show origin/main:scripts/qianwen-refresh/auto-refresh.sh > "\$BASE/bin/auto-refresh.latest.sh.tmp" 2>/dev/null \\
   && [ -s "\$BASE/bin/auto-refresh.latest.sh.tmp" ]; then
  mv "\$BASE/bin/auto-refresh.latest.sh.tmp" "\$BASE/bin/auto-refresh.latest.sh"
fi
[ -s "\$BASE/bin/auto-refresh.latest.sh" ] || { echo "bootstrap: 无可用 auto-refresh.sh" >&2; exit 1; }
exec /bin/zsh "\$BASE/bin/auto-refresh.latest.sh"
EOF
chmod +x "$BASE/bin/bootstrap.sh"
( git -C "$REPO" show origin/main:scripts/qianwen-refresh/auto-refresh.sh 2>/dev/null \
  || cat "$(dirname "$0")/auto-refresh.sh" ) > "$BASE/bin/auto-refresh.latest.sh"
[ -s "$BASE/bin/auto-refresh.latest.sh" ] || { echo "无法预热 auto-refresh.sh 缓存"; exit 1; }

# 下掉旧服务（保留 plist 备份，可回滚）
if launchctl print "gui/$UID_/$OLD" >/dev/null 2>&1; then
  launchctl bootout "gui/$UID_/$OLD" 2>/dev/null || true; echo "已停止旧服务 $OLD"
fi
[ -f "$HOME/Library/LaunchAgents/$OLD.plist" ] && mv -f "$HOME/Library/LaunchAgents/$OLD.plist" "$HOME/Library/LaunchAgents/$OLD.plist.disabled" && echo "旧 plist 已改名 .disabled"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/zsh</string><string>$BASE/bin/bootstrap.sh</string></array>
  <key>EnvironmentVariables</key><dict>
    <key>QW_REPO</key><string>$REPO</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>StartCalendarInterval</key><array>
    <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Hour</key><integer>17</integer><key>Minute</key><integer>30</integer></dict>
  </array>
  <key>RunAtLoad</key><false/>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$LOGDIR/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$LOGDIR/launchd.err.log</string>
</dict></plist>
EOF
chmod 644 "$PLIST"
launchctl bootout "gui/$UID_/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_" "$PLIST"
launchctl print "gui/$UID_/$LABEL" | grep -E "state|program|calendar" | head -5
echo "已安装 $LABEL：每日 09:30 / 17:30 自动刷新；日志 $LOGDIR/latest.log；状态 $BASE/status.json"
echo "手动触发：launchctl kickstart gui/$UID_/$LABEL"
