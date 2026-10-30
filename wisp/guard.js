// Anti pop-ups / pop-unders (s'exécute dans la page)
(() => {
  const off = () => document.documentElement.hasAttribute("data-wisp-off");
  const note = () => dispatchEvent(new CustomEvent("wisp-blocked"));
  let last = { t: 0, el: null };
  addEventListener("click", e => {
    if (!e.isTrusted) return;
    const el = e.composedPath().find(n => n.tagName && /^(A|BUTTON|INPUT|SUMMARY|LABEL)$/.test(n.tagName));
    last = { t: performance.now(), el };
  }, true);
  const host = u => { try { return new URL(u, location.href).hostname; } catch { return ""; } };
  const allowed = url => {
    if (off()) return true;
    const h = host(url);
    if (h === location.hostname) return true;
    const fresh = performance.now() - last.t < 1000, el = last.el;
    if (!fresh || !el) return false;
    if (el.tagName === "A") return host(el.href) === h;
    return el.tagName !== "LABEL";
  };
  const wo = window.open;
  window.open = function (url, ...r) {
    if (allowed(url || "about:blank") && (url || off())) return wo.call(this, url, ...r);
    note(); return null;
  };
  const ac = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if ((this.target === "_blank" || !this.isConnected) && !allowed(this.href)) { note(); return; }
    return ac.call(this);
  };
  if (window.Notification) {
    const rp = Notification.requestPermission;
    Notification.requestPermission = function (cb) {
      if (!off() && !navigator.userActivation?.isActive) { note(); cb?.("denied"); return Promise.resolve("denied"); }
      return rp.apply(this, arguments);
    };
  }
})();
