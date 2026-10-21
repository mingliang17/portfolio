import sys
from harness import *
import re
ok = True
def check(name, cond, info=""):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + name, "" if cond else info)

# (path, expected HTTP status, selector that proves the right page rendered, text expected somewhere)
# Files that the project DATA references but that are not in the repo (content gap, not a code bug).
KNOWN_MISSING = re.compile(r"assets/projects/(mh2/|mh1/images/[345]\.jpg)")
failed = []

ROUTES = [
    ("/",                    200, "canvas",            None),
    ("/home/",               200, "canvas",            None),
    ("/projects/mh1/",       200, ".scroll-stage",     None),
    ("/projects/mh2/",       200, ".scroll-stage",     None),
    ("/fotos/foto-au-1/",    200, ".foto-back-btn, a[href='/']", "Sydney Opera House"),
    ("/contact/",            200, "form",              None),
    ("/test/",               200, "canvas",            None),
    ("/projects/nope/",      404, None,                "Page not found"),
    ("/fotos/nope/",         404, None,                "Page not found"),
    ("/definitely/not/a/page/", 404, None,             "Page not found"),
]
with sync_playwright() as p:
    b, c, page, logs = launch(p, models=True)
    page.set_viewport_size({"width": 900, "height": 600})
    # Any sub-resource (image, script, model, font, ...) that fails to load is a bug: this is how a
    # `<img src={object}>` -> GET /[object Object] 404 went unnoticed.
    page.on("response", lambda r: failed.append((r.status, r.url.replace(BASE, ""))) if r.status >= 400 and r.request.resource_type != "document" and BASE in r.url and not KNOWN_MISSING.search(r.url) else None)
    for path, status, selector, text in ROUTES:
        logs.clear(); failed.clear()
        resp = page.goto(BASE + path, wait_until="domcontentloaded", timeout=120000)
        got = resp.status if resp else None
        if selector:
            try: page.wait_for_selector(selector, timeout=60000)
            except Exception: pass
        time.sleep(1.2)
        body = page.evaluate("document.body.innerText")
        found = bool(page.query_selector(selector)) if selector else True
        bad = [l for l in logs if (l[0] == 'pageerror' or 'hydrat' in l[1].lower() or 'did not match' in l[1].lower()) and 'Could not load' not in l[1]]
        check(f"{path:28s} status={got}", got == status and found and (text is None or text in body) and not bad,
              (got, found, text and (text in body), bad[:2]))
        check(f"{path:28s} no failed sub-resource requests", not failed, failed[:4])
    # no-slash URL redirects to canonical slash form
    resp = page.goto(BASE + "/projects/mh1", wait_until="domcontentloaded", timeout=120000)
    check("/projects/mh1 (no slash) ends on /projects/mh1/", page.url.rstrip('?scrolldebug').endswith("/projects/mh1/"), page.url)
    # client-side navigation through the navbar (no full reload)
    page.goto(BASE + "/contact/", wait_until="domcontentloaded", timeout=120000); time.sleep(1.5)
    page.evaluate("window.__marker = 'same-document'")
    page.click("a.navbar-desktop-link:has-text('Work')"); page.wait_for_url("**/projects/mh1/", timeout=60000); time.sleep(1)
    check("navbar link 'Work' -> /projects/mh1/ via client-side navigation", page.evaluate("window.__marker") == 'same-document' and page.query_selector(".scroll-stage") is not None)
    page.go_back(); page.wait_for_url("**/contact/", timeout=30000)
    check("browser Back returns to /contact/", "/contact/" in page.url)
    errs = [l for l in logs if l[0] == 'pageerror' and 'Could not load' not in l[1]]
    check("no uncaught page errors during navigation", not errs, errs[:2])
    print("ALL PASS" if ok else "SOME FAILED")
    b.close()
sys.exit(0 if ok else 1)
