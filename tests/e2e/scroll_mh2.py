import sys
from harness import *
ok=True
def check(name, cond, info=""):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ")+name, "" if cond else info)
def wait_idle(page, active=None, timeout=15):
    t0=time.time()
    while time.time()-t0 < timeout:
        s=st(page)
        if s and not s["anim"] and not s["pending"] and (active is None or s["active"]==active):
            time.sleep(0.15); s=st(page)
            if not s["anim"] and not s["pending"]: return s
        time.sleep(0.05)
    return st(page)
def swipe(page, n=60, start=130, step=2):
    for i in range(n): page.mouse.wheel(0, max(5, start-i*step)); time.sleep(0.016)
with sync_playwright() as p:
    b, c, page, logs = launch(p)
    open_page(page, BASE + "/projects/mh2?scrolldebug")
    page.mouse.move(240,150)
    s=st(page); order=page.evaluate("[...document.querySelectorAll('.scroll-layer')].map(l=>l.dataset.section)")
    check("mh2 sections & geometry (4 pages, total 3 screens)", order==['hero','map','model','carousel1'] and abs(s["total"]-3)<1e-6, (order, s["total"]))
    check("mh2 boots on hero", s["active"]=="hero", s)
    for nxt in ("map","model","carousel1"):
        page.mouse.wheel(0,100); s=wait_idle(page,nxt)
        check(f"page flick: one wheel notch -> {nxt}", s["active"]==nxt, s)
        time.sleep(0.4)
    page.mouse.wheel(0,100); s=wait_idle(page); check("flick past the last section stays put", s["active"]=="carousel1" and abs(s["raw"]-3)<0.03, s)
    time.sleep(0.4); page.mouse.wheel(0,-100); s=wait_idle(page,"model"); check("one notch UP -> model", s["active"]=="model", s)
    # momentum swipe from the top moves exactly one page
    page.evaluate("window.__scrollStage.goTo('hero',{immediate:true})"); time.sleep(0.6); wait_idle(page)
    swipe(page); s=wait_idle(page,"map")
    check("momentum swipe from hero advances exactly one page (map)", s["active"]=="map" and abs(s["raw"]-1)<0.03, s)
    # keyboard: space / arrow
    time.sleep(0.6); page.keyboard.press("Space"); s=wait_idle(page,"model"); check("Space -> next page", s["active"]=="model", s)
    time.sleep(0.4); page.keyboard.press("ArrowUp"); s=wait_idle(page,"map"); check("ArrowUp -> previous page", s["active"]=="map", s)
    # tiny accidental scroll snaps back
    time.sleep(0.4); page.mouse.wheel(0,6); s=wait_idle(page); check("6px accidental scroll snaps back to the same page", s["active"]=="map" and abs(s["raw"]-1)<0.03, s)
    # dots navigate
    page.click(".scroll-nav-dot:nth-child(4)"); s=wait_idle(page,"carousel1"); check("nav dot 4 -> carousel1", s["active"]=="carousel1", s)
    # carousel arrow keys only act on the ACTIVE carousel (only one exists here, so check handler count instead)
    errs=[l for l in logs if l[0]=='pageerror' and 'Could not load' not in l[1]]
    check("no uncaught page errors", not errs, errs[:3])
    # deep link on a FRESH load
    page.goto("about:blank")
    page.goto(BASE + "/projects/mh2?scrolldebug#model", wait_until="domcontentloaded")
    page.wait_for_function("() => window.__scrollStage && window.__scrollStage.getState().total > 0", timeout=30000)
    s=wait_idle(page,"model"); check("deep link #model on fresh load -> lands on model at rest", s and s["active"]=="model" and abs(s["raw"]-2)<0.03, s)
    # in-page hash change (link click / edited address bar) navigates without a reload
    page.evaluate("location.hash = '#map'"); s=wait_idle(page,"map")
    check("in-page hashchange #map -> navigates to map", s["active"]=="map" and abs(s["raw"]-1)<0.03, s)
    check("URL hash follows (#map)", page.evaluate("location.hash")=="#map")
    page.evaluate("location.hash = '#does-not-exist'"); time.sleep(0.8); s=wait_idle(page)
    check("unknown hash is ignored", s["active"]=="map", s)
    print("ALL PASS" if ok else "SOME FAILED")
    b.close()

sys.exit(0 if ok else 1)
