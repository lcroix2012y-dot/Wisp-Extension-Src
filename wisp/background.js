chrome.runtime.onInstalled.addListener(() => chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true }));
chrome.storage.session.setAccessLevel?.({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });
chrome.runtime.onMessage.addListener((m, s) => {
  if (!m.wisp || !s.tab) return;
  const k = "c" + s.tab.id;
  chrome.storage.session.get(k).then(r => chrome.storage.session.set({ [k]: (r[k] || 0) + m.n }));
});
chrome.webNavigation.onCommitted.addListener(d => { if (d.frameId === 0) chrome.storage.session.remove("c" + d.tabId); });
