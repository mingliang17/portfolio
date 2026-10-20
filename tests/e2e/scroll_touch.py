import sys
from harness import *
ok=True
def check(name, cond, info=""):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ")+name, "" if cond else info)
def wait_idle(page, active=None, timeout=20):
    t0=time.time()
    while time.time()-t0 < timeout:
        s=st(page)
        if s and not s["anim"] and not s["pending"] and (active is None or s["active"]==active):
            time.sleep(0.15); s=st(page)
            if not s["anim"] and not s["pending"]: return s
        time.sleep(0.05)
    return st(page)
with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    c = b.new_context(viewport={"width":390,"height":640}, has_touch=True, is_mobile=True, device_scale_factor=1)
    page = c.new_page()
    hdr = HDR
    page.route("**/*.hdr", lambda r: r.fulfill(status=200, body=hdr, headers={"content-type":"application/octet-stream","access-control-allow-origin":"*"}))
    for pat in ("**/*.glb","**/*.gltf"): page.route(pat, lambda r: r.abort())
    page.route(re.compile(r".*\.(jpg|jpeg|png|webp)(\?.*)?$"), lambda r: r.abort())
    page.route("**/fonts.cdnfonts.com/**", lambda r: r.abort())
    page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.scroll-layer{filter:none!important}.scroll-layer *{animation:none!important;backdrop-filter:none!important;filter:none!important}.carousel-container *{display:none!important}';document.head.appendChild(s)})")
    open_page(page)
    cdp = c.new_cdp_session(page)
    def drag(total, steps, dt):
        cdp.send("Input.dispatchTouchEvent", {"type":"touchStart","touchPoints":[{"x":200,"y":560}]})
        y=560
        for i in range(steps):
            y -= total/steps
            cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[{"x":200,"y":max(5,y)}]}); time.sleep(dt)
        cdp.send("Input.dispatchTouchEvent", {"type":"touchEnd","touchPoints":[]})
    # a drag can only cover ~550px of screen; chain several to simulate a long fling
    def fling(rounds=5):
        for _ in range(rounds):
            drag(520, 12, 0.008)
    drag(300, 15, 0.016); s=wait_idle(page)
    check("touch: finger drag scrolls freely inside a long section", s["raw"]>0.3 and s["active"]=="anime", s)

    page.evaluate("window.__scrollStage.goTo('appear',{edge:'end',immediate:true})"); time.sleep(0.5); wait_idle(page)
    fling(5)   # ≈ 2600px ≈ 4 screens of finger travel, fast
    s=wait_idle(page,'carousel1')
    check("touch: a hard multi-screen fling advances exactly ONE section (carousel1)", s["active"]=="carousel1" and abs(s["raw"]-22.75)<0.03, s)

    time.sleep(0.5)
    drag(420, 12, 0.012)   # a deliberate swipe DOWN-the-page direction reversed? (finger up = scroll forward)
    s=wait_idle(page,'carousel2')
    check("touch: next swipe -> carousel2", s["active"]=="carousel2" and abs(s["raw"]-23.75)<0.03, s)

    # tiny accidental touch movement must not change section
    page.evaluate("window.__scrollStage.goTo('carousel1',{immediate:true})"); time.sleep(0.5); wait_idle(page)
    drag(8, 3, 0.016); s=wait_idle(page)
    check("touch: an 8px accidental nudge snaps back (stays on carousel1)", s["active"]=="carousel1" and abs(s["raw"]-22.75)<0.03, s)
    print("ALL PASS" if ok else "SOME FAILED")
    b.close()

sys.exit(0 if ok else 1)
