const base = __LIBRARY__.replace(/\/+$/, "");
const prefix = "kiwi621:";
const full = name => prefix + name;
const native = () => typeof chrome !== "undefined" && !!chrome.storage?.local;

const local = {
  get(name, fallback) {
    try {
      const value = localStorage.getItem(full(name));
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(name, value) {
    try {
      localStorage.setItem(full(name), JSON.stringify(value));
    } catch {}
  },
  del(name) {
    try {
      localStorage.removeItem(full(name));
    } catch {}
  },
  clear() {
    try {
      for (const name of Object.keys(localStorage)) {
        if (name.startsWith(prefix)) {
          localStorage.removeItem(name);
        }
      }
    } catch {}
  }
};

export async function get(name, fallback = null) {
  if (native()) {
    try {
      const stored = await chrome.storage.local.get(full(name));
      return stored[full(name)] ?? fallback;
    } catch {}
  }
  return local.get(name, fallback);
}

export async function set(name, value) {
  if (native()) {
    try {
      await chrome.storage.local.set({ [full(name)]: value });
      return;
    } catch {}
  }
  local.set(name, value);
}

export async function del(name) {
  if (native()) {
    try {
      await chrome.storage.local.remove(full(name));
      return;
    } catch {}
  }
  local.del(name);
}

export async function clear() {
  if (native()) {
    try {
      const stored = await chrome.storage.local.get(null);
      const keys = Object.keys(stored).filter(name => name.startsWith(prefix));
      if (keys.length) {
        await chrome.storage.local.remove(keys);
      }
      return;
    } catch {}
  }
  local.clear();
}

export const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

const styleId = "kiwi621-theme";

export function theme(css) {
  let style = document.getElementById(styleId);
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    const nonce = document.querySelector("script[nonce]")?.nonce;
    if (nonce) style.nonce = nonce;
    (document.head || document.documentElement).append(style);
  }
  style.textContent = css;
}

export async function initTheme() {
  const active = await get("theme", null);
  if (active?.css) theme(active.css);
}

const url = path => `${base}/${path}`;
export const resolve = (path, link) => new URL(link, url(path)).href;

function request(message) {
  return new Promise((done, fail) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        fail(new Error(chrome.runtime.lastError.message));
      } else if (!response || response.error) {
        fail(new Error(response?.error || "request failed"));
      } else {
        done(response.data);
      }
    });
  });
}

export const json = path => request({ type: "json", url: url(path) });
export const text = link => request({ type: "text", url: link });