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

hdr = HDR
with sync_playwright() as p:
    # ---------- RESIZE ----------
    b2, c2, page, logs = launch(p)
    open_page(page)
    page.evaluate("window.__scrollStage.goTo('spin',{immediate:true})"); time.sleep(0.4)
    page.mouse.move(240,150); page.mouse.wheel(0,150); time.sleep(0.3); wait_idle(page)
    before=st(page); th0=page.evaluate("document.querySelector('.scroll-track').offsetHeight")
    page.set_viewport_size({"width":600,"height":420}); time.sleep(1.5); wait_idle(page)
    after=st(page); th1=page.evaluate("document.querySelector('.scroll-track').offsetHeight")
    check("resize: still on the same section", after["active"]==before["active"], (before,after))
    check("resize: screen position preserved (±0.1 screens)", abs(after["raw"]-before["raw"])<0.1, (before["raw"],after["raw"]))
    check("resize: track height rescaled", th1 != th0 and abs(th1-(after["total"]+1)*420)<2, (th0,th1))
    c2.close(); b2.close()

    # ---------- REDUCED MOTION ----------
    for rm in (False, True):
        b3 = p.chromium.launch(args=ARGS)
        c3 = b3.new_context(viewport={"width":480,"height":300}, reduced_motion="reduce" if rm else "no-preference")
        page = c3.new_page()
        page.route("**/*.hdr", lambda r: r.fulfill(status=200, body=hdr, headers={"content-type":"application/octet-stream","access-control-allow-origin":"*"}))
        for pat in ("**/*.glb","**/*.gltf"): page.route(pat, lambda r: r.abort())
        page.route(re.compile(r".*\.(jpg|jpeg|png|webp)(\?.*)?$"), lambda r: r.abort())
        # NOTE: no CSS filter-killing here: we want to read the engine's inline styles
        open_page(page)
        info = page.evaluate("""() => { const e=window.__scrollStage; e.goTo('appear',{edge:'end',immediate:true}); return 1 }""")
        time.sleep(0.5)
        # park the scroll in the middle of the appear -> carousel1 transition and read inline layer styles
        page.evaluate("""() => { const e=window.__scrollStage; window.__mid = e.toPx(22.25); window.scrollTo({top: window.__mid, behavior:'instant'}); }""")
        time.sleep(0.06)
        css = page.evaluate("[...document.querySelectorAll('.scroll-layer')].filter(l=>l.style.visibility==='visible').map(l=>[l.dataset.section,l.style.transform,l.style.filter,l.style.opacity])")
        has_motion = any(('translate3d' in (r[1] or '')) or ('blur' in (r[2] or '')) for r in css)
        print("   reduced=%s mid-transition layers:"%rm, css)
        check(f"reduced-motion={rm}: transform/blur {'absent (fade only)' if rm else 'present'}", (not has_motion) if rm else has_motion, css)
        c3.close(); b3.close()
    print("ALL PASS" if ok else "SOME FAILED")

sys.exit(0 if ok else 1)
