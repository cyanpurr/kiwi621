const base = __LIBRARY__.replace(/\/+$/, "");
const prefix = `${base}/`;
const repo = "https://github.com/cyanpurr/kiwi621";

chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: repo }));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const type = msg?.type;
  if (!msg || (type !== "json" && type !== "text")) {
    sendResponse({ error: "unknown request" });
    return;
  }
  if (typeof msg.url !== "string" || !msg.url.startsWith(prefix)) {
    sendResponse({ error: "blocked url" });
    return;
  }
  fetch(msg.url, { cache: "no-store" })
    .then(async resp => {
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`.trim());
      sendResponse({ data: type === "json" ? await resp.json() : await resp.text() });
    })
    .catch(err => sendResponse({ error: err.message }));
  return true;
});