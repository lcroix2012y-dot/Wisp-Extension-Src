const $ = id => document.getElementById(id), dnr = chrome.declarativeNetRequest;
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = ""; try { const u = new URL(tab.url); if (u.protocol.startsWith("http")) host = u.hostname; } catch {}
  $("host").textContent = host || "page du navigateur";
  const on = (await dnr.getEnabledRulesets()).includes("wisp");
  $("global").checked = on;
  const dyn = await dnr.getDynamicRules();
  const allowed = dyn.find(r => r.condition.urlFilter === `||${host}/`);
  const siteBox = $("site"); siteBox.checked = !allowed; siteBox.disabled = !host || !on;
  const state = () => $("siteState").textContent = !host ? "Indisponible ici" : !on ? "En pause partout" : siteBox.checked ? "Wisp veille sur ce site" : "Protection désactivée ici";
  state();
  let a = 0, t = 0;
  try { const { rulesMatchedInfo } = await dnr.getMatchedRules({ tabId: tab.id });
    rulesMatchedInfo.forEach(m => m.rule.ruleId === 2 ? t++ : a++); } catch {}
  a += (await chrome.storage.session.get('c' + tab.id))['c' + tab.id] || 0;
  $("ads").textContent = a; $("trk").textContent = t;
  const total = a + t, start = performance.now();
  (function tick(n) { const k = Math.min(1, (n - start) / 600); $("count").textContent = Math.round(total * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(tick); })(start);
  $("label").textContent = total === 1 ? "élément bloqué sur cette page" : "éléments bloqués sur cette page";
  siteBox.onchange = async () => {
    const cur = (await dnr.getDynamicRules()).find(r => r.condition.urlFilter === `||${host}/`);
    if (siteBox.checked && cur) await dnr.updateDynamicRules({ removeRuleIds: [cur.id] });
    if (!siteBox.checked && !cur) await dnr.updateDynamicRules({ addRules: [{ id: Date.now() % 1e9, priority: 2, action: { type: "allowAllRequests" }, condition: { urlFilter: `||${host}/`, resourceTypes: ["main_frame"] } }] });
    const { allow = [] } = await chrome.storage.local.get('allow');
    await chrome.storage.local.set({ allow: siteBox.checked ? allow.filter(h => h !== host) : [...new Set([...allow, host])] });
    state(); chrome.tabs.reload(tab.id);
  };
  $("global").onchange = async e => {
    await dnr.updateEnabledRulesets(e.target.checked ? { enableRulesetIds: ["wisp"] } : { disableRulesetIds: ["wisp"] });
    await chrome.storage.local.set({ paused: !e.target.checked });
    chrome.tabs.reload(tab.id); window.close();
  };
})();
