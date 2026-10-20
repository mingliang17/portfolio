import sys
from harness import *
ok = True
def check(name, cond, info=""):
    global ok
    ok &= bool(cond)
    print(("PASS " if cond else "FAIL ") + name, "" if cond else info)

def quiet(page, extra=0.35):
    time.sleep(extra); settle(page, 8); time.sleep(extra); return settle(page, 8)

def wait_idle(page, active=None, timeout=10):
    # poll until the engine is idle (and, if given, on the expected section)
    t0=time.time(); last=None
    while time.time()-t0 < timeout:
        last = st(page)
        if not last["anim"] and not last["pending"] and (active is None or last["active"]==active):
            time.sleep(0.15); last = st(page)
            if not last["anim"] and not last["pending"]: return last
        time.sleep(0.05)
    return last

def swipe(page, n=70, start=130, step=2):
    for i in range(n):
        page.mouse.wheel(0, max(5, start - i*step)); time.sleep(0.016)

with sync_playwright() as p:
    b, c, page, logs = launch(p)
    open_page(page)
    page.mouse.move(240, 150)
    s = st(page); check("boot at anime start, window=[0,6.25]", s["active"]=="anime" and s["s"]==0, s)

    # T1 free scroll inside a long section
    wheel(page, 100); s = quiet(page)
    check("T1 one notch inside long section = free scroll, no snapping", 0.05 < s["raw"] < 0.5 and s["active"]=="anime", s)

    # T2a from the interior, a hard continuous scroll may cross ONE boundary (to next section start) and no further
    wheel(page, 100, n=80, gap=0.012); s = quiet(page)
    check("T2a continuous scroll from interior crosses exactly one boundary -> spin start 7.25", s["active"]=="spin" and abs(s["raw"]-7.25) < 0.03, s)

    # T2b from a section START, continuous scroll must stop at the END of that long section (wall)
    wheel(page, 100, n=80, gap=0.012); time.sleep(0.1); s = st(page)
    check("T2b WALL: hammering from spin start stops at spin END 12.25", abs(s["raw"]-12.25) < 0.03 and s["active"]=="spin", s)
    s = quiet(page)

    # T3 fresh single notch commits to next section
    wheel(page, 100); s = quiet(page, 0.5)
    check("T3 one notch at section end -> next section start (explode 13.25)", s["active"]=="explode" and abs(s["raw"]-13.25) < 0.03, s)

    # T4 one notch back lands at END of the previous long section
    time.sleep(0.4); wheel(page, -100); s = quiet(page, 0.5)
    check("T4 scroll UP arrives at END of previous long section (spin 12.25)", s["active"]=="spin" and abs(s["raw"]-12.25) < 0.03, s)

    # T5 trackpad momentum: ~5 screens of decaying events from a boundary advance exactly ONE section
    page.evaluate("window.__scrollStage.goTo('appear', {edge:'end', immediate:true})"); time.sleep(0.5); s = settle(page)
    check("T5 setup: instant goTo has no smoothing lag", abs(s["s"]-21.75) < 0.01, s)
    swipe(page); s = quiet(page, 0.5)
    check("T5 momentum swipe advances exactly one section (carousel1 22.75)", s["active"]=="carousel1" and abs(s["raw"]-22.75) < 0.03, s)
    time.sleep(0.6); swipe(page); s = quiet(page, 0.5)
    check("T5b second swipe -> carousel2 23.75", s["active"]=="carousel2" and abs(s["raw"]-23.75) < 0.03, s)
    time.sleep(0.6); swipe(page); s = quiet(page, 0.5)
    check("T5c swipe at the very end stays at the end", s["active"]=="carousel2" and abs(s["raw"]-23.75) < 0.03, s)

    # T6 keyboard (native keys feed the same engine)
    time.sleep(0.5); page.keyboard.press("PageUp"); s = wait_idle(page, "carousel1")
    check("T6 PageUp -> previous section (carousel1)", s["active"]=="carousel1", s)
    page.keyboard.press("ArrowUp"); s = wait_idle(page, "appear")
    check("T6 ArrowUp -> END of appear (21.75)", s["active"]=="appear" and abs(s["raw"]-21.75) < 0.03, s)

    # T7 layer state at rest (let everything finish first)
    s = wait_idle(page, "appear"); time.sleep(0.4)
    st_layers = page.evaluate("[...document.querySelectorAll('.scroll-layer')].map(l=>[l.dataset.section,l.style.visibility,l.inert,l.style.opacity,l.style.transform,l.style.filter])")
    vis = [l for l in st_layers if l[1]=='visible']
    print("   visible layers:", [(l[0], l[3][:6]) for l in vis])
    check("T7 at rest exactly one layer visible & not inert, no leftover transform/filter", len(vis)==1 and vis[0][0]=='appear' and vis[0][2] is False and vis[0][4] in ('none','') and vis[0][5] in ('none',''), st_layers)

    # T8 nav dot: far jump (instrumented)
    page.evaluate("window.__scrollStage.goTo('appear',{edge:'end',immediate:true})"); time.sleep(0.5)
    t0=time.time(); page.click(".scroll-nav-dot:nth-child(1)")
    snaps=[]
    while time.time()-t0 < 25:
        x=st(page); snaps.append((round(time.time()-t0,1), x["active"], x["raw"], 'T' if x["anim"] else '-', 'P' if x["pending"] else '-'))
        if x["active"]=="anime" and not x["anim"] and not x["pending"]: break
        time.sleep(0.25)
    s = st(page); took=time.time()-t0
    check("T8 nav dot -> anime start (0) from far away, within 4s", s["active"]=="anime" and abs(s["raw"]) < 0.03 and took < 4, (s, round(took,2)))
    if took >= 4: print("   trace:", snaps[:30])
    print("   nav jump took %.2fs" % took)

    # T9 URL hash follows the active section (router-safe)
    page.evaluate("window.__scrollStage.goTo('explode',{immediate:true})"); time.sleep(0.6)
    h = page.evaluate("location.hash"); check("T9 URL hash follows section", h=="#explode", h)
    check("T9 history.state preserved (router safe)", page.evaluate("history.state !== undefined"))

    errs = [l for l in logs if l[0]=='pageerror' and 'Could not load' not in l[1]]  # blocked-model fetches are expected in this cheap mode
    check("no uncaught page errors", not errs, errs[:3])
    print("ALL PASS" if ok else "SOME FAILED")
    b.close()

sys.exit(0 if ok else 1)
