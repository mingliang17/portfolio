#!/bin/bash
# Start the site, run one e2e script, stop the site.     usage: [MODE=dev|start|static] tests/e2e/run.sh scroll_mh1.py
#   MODE=dev     (default) `next dev`                       — what `npm run dev` gives you
#   MODE=start   `next build` + `next start`                — the Node.js server deployment
#   MODE=static  `build:static` + scripts/serve-static.mjs  — the static-export deployment
#   SKIP_BUILD=1 reuse an existing .next / out build
# Requires: pip install playwright && playwright install chromium
cd "$(dirname "$0")/../.."
PORT=${PORT:-5199}
case "${MODE:-dev}" in
  dev)    npx next dev -p $PORT > /tmp/site-e2e.log 2>&1 & ;;
  start)  [ -n "$SKIP_BUILD" ] || npm run build > /tmp/site-build.log 2>&1 || { tail -30 /tmp/site-build.log; exit 1; }
          npx next start -p $PORT > /tmp/site-e2e.log 2>&1 & ;;
  static) [ -n "$SKIP_BUILD" ] || npm run build:static > /tmp/site-build.log 2>&1 || { tail -30 /tmp/site-build.log; exit 1; }
          PORT=$PORT node scripts/serve-static.mjs > /tmp/site-e2e.log 2>&1 & ;;
esac
SPID=$!
for i in $(seq 1 90); do curl -s -o /dev/null --max-time 2 http://127.0.0.1:$PORT/ && break; sleep 1; done
cd tests/e2e && timeout ${T:-240} python3 "$@"
STATUS=$?
kill $SPID 2>/dev/null; wait $SPID 2>/dev/null
exit $STATUS
