#!/usr/bin/env python3
"""选资产快照日：最近一个「跑完」的 cal_date。
判据：该日 ROOT 行数 >= 前一日的 99.5%，且总资产与前一日相差 < 1%；否则退回前一日。
打印 YYYY-MM-DD；redash 不可达时非零退出。"""
import os, re, subprocess, sys
from datetime import date, timedelta

REDASH = os.path.expanduser("~/.claude/skills/redash/redash.py")
since = (date.today() - timedelta(days=7)).isoformat()
sql = f"""SELECT cal_date, COUNT(*) c, ROUND(SUM(total_asset)) ta
FROM ying99_asset.dwd_app_service_account_profit_combine USE INDEX(idx_cal_date_saId)
WHERE cal_date>='{since}' AND relation_account_type='ROOT'
GROUP BY cal_date ORDER BY cal_date"""
if not os.environ.get("REDASH_API_KEY"):
    sys.exit("缺少 REDASH_API_KEY（launchd 下需由 auto-refresh.sh source ~/.zshrc）")
proc = subprocess.run([sys.executable, REDASH, "execute-adhoc", "--timeout", "300", "--sql", sql],
                      capture_output=True, text=True, timeout=400)
out = proc.stdout
rows = []
for line in out.splitlines():
    m = re.match(r"^(\d{4}-\d{2}-\d{2})\s+(\d+)\s+([\d.]+)", line.strip())
    if m:
        rows.append((m.group(1), int(m.group(2)), float(m.group(3))))
if len(rows) < 2:
    sys.exit(f"资产批次查询无结果: {(proc.stderr or out)[-300:]}")
rows.sort()
for i in range(len(rows) - 1, 0, -1):
    d, c, ta = rows[i]; _, pc, pta = rows[i - 1]
    if c >= pc * 0.995 and abs(ta - pta) / max(pta, 1) < 0.01:
        print(d); sys.exit(0)
print(rows[0][0])
