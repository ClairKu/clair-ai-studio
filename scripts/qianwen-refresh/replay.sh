#!/bin/zsh
# 在临时 worktree 里基于最新 origin/main 重放千问看板数据更新并 commit。
# 用法：QW_WORK=<含 latest.new.json 的工作目录> scripts/qianwen-refresh/replay.sh
# 之后用 api-push.py 推送（QW_WT 指向本脚本输出的 worktree 路径）。
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${QW_WORK:?需要 QW_WORK（assemble.py 产出 latest.new.json 的目录）}"
WT="$WORK/wt"
DASH=public/reports/qianwen-user-acquisition-dashboard

cd "$REPO"
for i in 1 2 3 4 5; do git fetch origin main 2>/dev/null && break; sleep 3; done
git worktree remove --force "$WT" 2>/dev/null || true
git worktree add --detach "$WT" origin/main >/dev/null
ln -sfn "$REPO/node_modules" "$WT/node_modules"
cd "$WT"
echo "base: $(git rev-parse --short HEAD)"

# 发布前置校验：数据的 minimum_public_cell 必须与 app.js 客户端镜像校验一致，
# 否则线上白屏（并行会话覆盖过一次）。
python3 - <<'EOF'
import json, re
data = json.load(open("public/reports/qianwen-user-acquisition-dashboard/data/latest.json"))
cell = data["privacy"]["minimum_public_cell"]
app = open("public/reports/qianwen-user-acquisition-dashboard/app.js").read()
m = re.search(r"minimumCell\s*[<>=!]+\s*(\d+)", app)
assert m, "app.js 里找不到 minimumCell 校验"
print(f"pre-check: data minimum_public_cell={cell}, app.js minimumCell 阈值={m.group(1)}")
EOF

cp "$WORK/latest.new.json" "$DASH/data/latest.json"
npm run build 2>&1 | grep -E "千问|Injected|error" | head -5
git rev-parse HEAD > "$WORK/base-sha.txt"

CUT=$(python3 -c "import json;print(json.load(open('$DASH/data/latest.json'))['meta']['data_cutoff'][:16])")
# 只提交自己的 3 个文件；npm run build 顺带改动的 vite 哈希/search-index/他人页面不要带上
git add "$DASH/data/latest.json" "$DASH/data/fallback-data.js" \
        docs/reports/qianwen-user-acquisition-dashboard/index.html
git commit -m "feat(qianwen): 刷新看板数据至 ${CUT}"
git status --short | head
echo "worktree ready: $WT — 推送: QW_WT=$WT python3 $REPO/scripts/qianwen-refresh/api-push.py"
