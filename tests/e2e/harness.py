import json, time, re
from playwright.sync_api import sync_playwright

import os
BASE = os.environ.get("BASE_URL", "http://127.0.0.1:5199")
# Minimal valid Radiance .hdr (4x2 grey). drei's <Environment preset> fetches an HDR from a CDN;
# stubbing it keeps the tests offline and stops a CDN hiccup from failing scroll tests.
# 1x1 PNG stand-in for https://picsum.photos placeholder images (the sandbox/CI has no internet)
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082")
HDR = b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 2 +X 4\n" + bytes([128, 128, 128, 129]) * 8
URL = BASE + "/projects/mh1?scrolldebug"
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]

STATE_JS = """() => {
  const e = window.__scrollStage; if (!e) return null;
  const st = e.getState();
  const stage = document.querySelector('.scroll-stage').getBoundingClientRect();
  return { s: +st.s.toFixed(3), raw: +st.raw.toFixed(3), total: st.total, active: st.activeId, win: st.window.map(v=>+v.toFixed(2)),
           anim: st.animating, pending: st.pendingSettle, trans: st.transitioning, y: Math.round(window.scrollY), stageTop: Math.round(stage.top) };
}"""

def launch(p, models=False, **ctx):
    b = p.chromium.launch(args=ARGS)
    c = b.new_context(viewport={"width": 480, "height": 300}, **ctx)
    page = c.new_page()
    hdr = HDR
    page.route("**/*.hdr", lambda r: r.fulfill(status=200, body=hdr, headers={"content-type":"application/octet-stream","access-control-allow-origin":"*"}))
    page.route("**/fonts.cdnfonts.com/**", lambda r: r.abort())
    page.route("**/picsum.photos/**", lambda r: r.fulfill(status=200, body=PNG, headers={"content-type":"image/png","access-control-allow-origin":"*"}))
    if not models:  # cheap mode for scroll-logic tests: don't load/render heavy 3D models
        page.route("**/*.glb", lambda r: r.abort())
        page.route("**/*.gltf", lambda r: r.abort())
        page.route(re.compile(r".*\.(jpg|jpeg|png|webp)(\?.*)?$"), lambda r: r.abort())
        page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.scroll-layer{filter:none!important}.scroll-layer *{animation:none!important;backdrop-filter:none!important;filter:none!important}.carousel-container *{display:none!important}';document.head.appendChild(s)})")
    logs = []
    page.on("console", lambda m: logs.append((m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: logs.append(("pageerror", str(e))))
    return b, c, page, logs

def open_page(page, url=URL):
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_function("() => window.__scrollStage && window.__scrollStage.getState().total > 0", timeout=30000)
    time.sleep(0.5)

def st(page):
    return page.evaluate(STATE_JS)

def settle(page, timeout=6.0):
    """wait until engine reports no tween/pending gesture"""
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = st(page)
        if not s["anim"] and not s["pending"]:
            return s
        time.sleep(0.05)
    return st(page)

def wheel(page, dy, n=1, gap=0.0):
    for _ in range(n):
        page.mouse.wheel(0, dy)
        if gap: time.sleep(gap)
