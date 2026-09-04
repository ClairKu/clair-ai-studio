#!/usr/bin/env python3
"""经 GitHub Git Data API 推送本次提交的变更（直连 443 常被断，走 API 更稳）。"""
import json, os, subprocess, base64
from pathlib import Path

REPO = os.environ.get("QW_REPO", "clairku/clair-ai-studio")
WT = Path(os.environ["QW_WT"])  # replay.sh 产出的 worktree（HEAD 为待推提交）
EXPECTED_BASE = (WT.parent / "base-sha.txt").read_text().strip()
MESSAGE = subprocess.run(["git", "-C", str(WT), "log", "-1", "--format=%B"],
                         capture_output=True, text=True).stdout.strip()
token = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True).stdout.strip()
assert token, "no gh token"
RESOLVE_IPS = [None, "140.82.113.6"]

def api(method, path, body=None):
    last = None
    for ip in RESOLVE_IPS:
        args = ["curl", "-s", "-S", "--max-time", "90", "-X", method]
        if ip: args += ["--resolve", f"api.github.com:443:{ip}"]
        args += ["-H", f"Authorization: token {token}",
                 "-H", "Accept: application/vnd.github+json", "-w", "\n%{http_code}"]
        if body is not None:
            args += ["-H", "Content-Type: application/json", "--data-binary", "@-"]
        args.append(f"https://api.github.com{path}")
        r = subprocess.run(args, input=json.dumps(body) if body is not None else None,
                           capture_output=True, text=True, timeout=120)
        if "\n" not in r.stdout:
            last = r.stderr.strip() or "no response"; continue
        payload, status = r.stdout.rsplit("\n", 1)
        if not status.strip().isdigit():
            last = payload[-200:]; continue
        status = int(status); data = json.loads(payload) if payload.strip() else {}
        if status >= 400: raise SystemExit(f"{method} {path} -> {status}: {data.get('message')}")
        return data
    raise SystemExit(f"API unreachable: {last}")

head = api("GET", f"/repos/{REPO}/git/ref/heads/main")["object"]["sha"]
print("remote head:", head[:12])
if head != EXPECTED_BASE:
    raise SystemExit(f"远端 HEAD 已变（{head[:12]}），需基于新 HEAD 重放后再推")
base_tree = api("GET", f"/repos/{REPO}/git/commits/{head}")["tree"]["sha"]

changed = subprocess.run(["git","-C",str(WT),"diff","--name-status","HEAD~1","HEAD"],
                         capture_output=True, text=True).stdout.strip().splitlines()
tree_entries = []
for line in changed:
    status, path = line.split("\t", 1)
    if status == "D":
        tree_entries.append({"path": path, "mode": "100644", "type": "blob", "sha": None})
        print("delete", path)
    else:
        sha = api("POST", f"/repos/{REPO}/git/blobs",
                  {"content": base64.b64encode((WT / path).read_bytes()).decode(), "encoding": "base64"})["sha"]
        tree_entries.append({"path": path, "mode": "100644", "type": "blob", "sha": sha})
        print("blob", path, sha[:12])

tree = api("POST", f"/repos/{REPO}/git/trees", {"base_tree": base_tree, "tree": tree_entries})["sha"]
commit = api("POST", f"/repos/{REPO}/git/commits",
             {"message": MESSAGE, "tree": tree, "parents": [head],
              "author": {"name": "Clair", "email": "9941648+ClairKu@users.noreply.github.com"}})["sha"]
print("commit", commit[:12])
print("ref ->", api("PATCH", f"/repos/{REPO}/git/refs/heads/main", {"sha": commit, "force": False})["object"]["sha"][:12])
print("DONE")
