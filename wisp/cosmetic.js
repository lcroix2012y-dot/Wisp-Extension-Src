// Masque les pubs restantes + supprime les calques piégés
(() => {
  let host = location.hostname;
  try { if (location.ancestorOrigins?.length) host = new URL(location.ancestorOrigins[location.ancestorOrigins.length - 1]).hostname; } catch {}
  chrome.storage.local.get({ paused: false, allow: [] }).then(({ paused, allow }) => {
    if (paused || allow.includes(host)) return document.documentElement.setAttribute("data-wisp-off", "");
    run();
  });
  function run() {
    const SEL = ['ins.adsbygoogle', '.adsbygoogle', '[id^="google_ads"]', '[id^="div-gpt-ad"]', '[id^="aswift"]', '[id^="ad-"]', '[id^="ad_"]', '[id$="-ad"]', '[class^="ad-"]', '[class^="ad_"]', '[class~="ad"]', '[class~="ads"]', '#ads', '[class*="adsbox"]', '[class*="advert"]', '[class*="ad-banner"]', '[class*="ad-slot"]', '[class*="ad-unit"]', '[class*="ad-container"]', '[class*="banner-ad"]', '[class*="sponsored"]', '[class*="in-page-push"]', '[class*="inpage-push"]', '[class*="interstitial"]', '[class*="popunder"]', '[data-ad]', '[data-ad-slot]', '[data-ad-client]', '[data-google-query-id]', 'object[data*=".swf"]', 'embed[src*=".swf"]', 'object[type="application/x-shockwave-flash"]', 'embed[type="application/x-shockwave-flash"]', 'img[src*="ads_banner"]', 'img[src*="advertising"]', 'img[src*="/ads/"]', 'img[src*="banner_ad"]', 'img[src*="banner-ad"]', 'img[src*="ad-banner"]', 'img[src*="adbanner"]', 'img[src*="advert"]', 'img[width="728"][height="90"]', 'img[width="468"][height="60"]', 'img[width="300"][height="250"]', 'img[width="160"][height="600"]', 'img[width="970"][height="90"]',  '[aria-label="Advertisement" i]', '[aria-label="Publicité" i]', 'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]', 'iframe[id^="google_ads"]', 'a[href*="doubleclick.net"]', 'a[href*="adsterra"]', 'a[href*="exoclick"]', 'a[href*="propellerads"]'].join(',');
    const st = document.createElement("style");
    st.textContent = SEL + "{display:none!important}";
    (document.head || document.documentElement).append(st);
    const AD = /doubleclick|googlesyndication|adsterra|exoclick|exosrv|propeller|popads|popcash|taboola|outbrain|monetag|hilltopads|clickadu|juicyads|adcash|mgid|highperformanceformat|effectivegatecpm|profitablecpm|onclickads|realsrv|pushame|a-ads|criteo|adnxs/i;
    const LABELS = new Set(["advertisement", "advertisements", "publicité", "sponsored", "sponsorisé", "annonce"]);
    const AP = /(^|[\/_.-])(ads?|adv|adverts?|advertis\w*|adbanner|adimg|adimage|adview|banner[-_]?ads?|sponsor\w*)([\/_.?-]|\d|$)|(^|\D)(728x90|468x60|300x250|336x280|160x600|120x600|970x90|320x50|300x600)(\D|$)/i;
    const adImg = i => AP.test(i.currentSrc || i.src || "");
    document.addEventListener("error", e => { const t = e.target; if (t && t.tagName === "IMG" && adImg(t)) hide(t); }, true);
    const seen = new WeakSet(); let n = 0, sent = 0, timer = 0;
    const hide = el => { if (seen.has(el)) return; seen.add(el); el.style.setProperty("display", "none", "important"); n++; };
    function sweep() {
      timer = 0;
      document.querySelectorAll(SEL).forEach(hide);
      document.querySelectorAll("img").forEach(i => adImg(i) && hide(i));
      document.querySelectorAll("iframe[src]").forEach(f => AD.test(f.src) && hide(f));
      document.querySelectorAll("div,span,p,small,b,h5,h6").forEach(el => {
        if (el.children.length || seen.has(el)) return;
        const t = el.textContent.trim().toLowerCase();
        if (!LABELS.has(t)) return;
        const p = el.parentElement;
        hide(p && p !== document.body && p.innerText.trim().length <= t.length + 5 ? p : el);
      });
      // calques invisibles plein écran qui volent les clics
      if (document.body) for (const el of document.body.children) {
        if (seen.has(el) || !/^(DIV|A|SPAN|IFRAME)$/.test(el.tagName)) continue;
        const cs = getComputedStyle(el);
        if (!/fixed|absolute/.test(cs.position) || (+cs.zIndex || 0) < 100) continue;
        const r = el.getBoundingClientRect();
        if (r.width < innerWidth * .8 || r.height < innerHeight * .8) continue;
        if (el.tagName === "IFRAME" ? AD.test(el.src) : !el.innerText.trim() && !el.querySelector("img,video,canvas,svg,input,button")) { hide(el); el.remove(); }
      }
      flush();
    }
    function flush() { if (n > sent) { try { chrome.runtime.sendMessage({ wisp: 1, n: n - sent }); } catch {} sent = n; } }
    addEventListener("wisp-blocked", () => { n++; flush(); });
    const go = () => { if (!timer) timer = setTimeout(sweep, 250); };
    new MutationObserver(go).observe(document.documentElement, { childList: true, subtree: true });
    addEventListener("DOMContentLoaded", go); addEventListener("load", go); go();
  }
})();
