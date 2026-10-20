#!/bin/bash
# Start vite, run one e2e script, stop vite.   usage: tests/e2e/run.sh scroll_mh1.py
# Requires: pip install playwright && playwright install chromium
cd "$(dirname "$0")/../.."
npx vite --port 5199 --host 127.0.0.1 > /tmp/vite-e2e.log 2>&1 &
VPID=$!
for i in $(seq 1 40); do curl -s -o /dev/null --max-time 1 http://127.0.0.1:5199/ && break; sleep 0.5; done
cd tests/e2e && timeout ${T:-240} python3 "$@"
STATUS=$?
kill $VPID 2>/dev/null; wait $VPID 2>/dev/null
exit $STATUS
