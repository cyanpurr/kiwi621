import { del, get, set, text } from "./core.js";
import { important } from "./dialog.js";
import { route } from "./router.js";

const bridge = `(function () {
  const maps = { top: new Map(), sub: new Map() };
  const doc = parent.document;
  const slug = text => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const clean = path => String(path).replace(/\\/+$/, "") || "/";
  const menu = kind => doc.querySelector(kind === "top" ? "nav.navigation menu.nav-help" : "nav.navigation menu.nav-secondary");

  function hit(path, value) {
    path = clean(path);
    return (Array.isArray(value) ? value : value ? [value] : ["*"]).some(pattern => {
      const target = clean(pattern);
      if (target === "*" || target === "/*") return true;

      const parts = target.split("*");
      const first = parts.shift();
      if (first && !path.startsWith(first)) return false;

      let at = first.length;
      for (const part of parts) {
        const found = path.indexOf(part, at);
        if (found < 0) return false;
        at = found + part.length;
      }
      return target.endsWith("*") || at === path.length;
    });
  }

  function del(kind, id) {
    const item = maps[kind].get(id);
    item?.remove();
    maps[kind].delete(id);
  }

  function add(kind, options = {}) {
    const target = menu(kind);
    if (!target || !options.label || (kind === "sub" && !hit(parent.location.pathname, options.location))) return null;

    const key = options.id || slug(options.label);
    del(kind, key);

    const prefix = kind === "top" ? "nav" : "subnav";
    const item = doc.createElement("li");
    item.id = prefix + "-" + key;
    item.className = (kind === "top" ? "nav-help-" : "subnav-") + key;

    const link = doc.createElement("a");
    link.id = item.id + "-link";
    link.href = options.href || "/";
    link.textContent = options.label;

    if (options.title) link.title = options.title;
    if (options.style) Object.assign(link.style, options.style);
    if (options.onClick) link.addEventListener("click", options.onClick);

    item.append(link);

    const anchor = (options.after && target.querySelector(options.after)) || (options.before && target.querySelector(options.before));
    if (anchor && options.after) {
      anchor.after(item);
    } else if (anchor) {
      anchor.before(item);
    } else {
      target.append(item);
    }

    maps[kind].set(key, item);
    return item;
  }

  function serialize(content) {
    const value = typeof content === "function" ? content() : content;
    if (value == null) return "";
    if (Array.isArray(value)) {
      return value.map(item => item?.outerHTML || String(item)).join("");
    }
    return value.outerHTML || String(value);
  }

  const pending = new Map();
  let seq = 0;

  function call(method, key, value) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      parent.postMessage({ source: "kiwi621", kind: "request", id, method, key, value }, "*");
    });
  }

  window.addEventListener("message", event => {
    const data = event.data;
    if (!data || data.source !== "kiwi621" || data.kind !== "response") return;

    const item = pending.get(data.id);
    if (!item) return;

    pending.delete(data.id);
    if (data.error) {
      item.reject(new Error(data.error));
    } else {
      item.resolve(data.value);
    }
  });

  const api = {
    addTopbarLink: options => add("top", options),
    removeTopbarLink: id => del("top", id),
    addSubnavLink: options => add("sub", options),
    removeSubnavLink: id => del("sub", id),
    registerRoute: (value = {}) => call("registerRoute", null, {
      path: value.path,
      title: value.title,
      sitemap: Boolean(value.sitemap),
      content: serialize(value.content)
    }),
    important: (value = {}) => call("important", null, {
      title: value.title,
      content: value.content,
      buttons: (value.buttons || []).map(item => typeof item === "string" ? item : {
        label: item.label,
        className: item.className,
        style: item.style
      })
    }),
    getSetting: (key, fallback) => call("getSetting", key, fallback),
    setSetting: (key, value) => call("setSetting", key, value),
    removeSetting: key => call("removeSetting", key)
  };

  window.kiwi621 = api;
  parent.kiwi621 = api;
})();`;

const codeKey = id => `plugin-code:${id}`;

export async function getPlugins() {
  const value = await get("plugins", []);
  return Array.isArray(value) ? value.filter(plugin => plugin?.id && plugin?.url) : [];
}

export const setPlugins = plugins => set("plugins", plugins);

const getCode = async id => {
  const code = await get(codeKey(id), null);
  return typeof code === "string" ? code : null;
};

export const setCode = (id, code) => set(codeKey(id), code);
export const dropCode = id => del(codeKey(id));

function wrap(code) {
  return `try {
    (function (kiwi621, document, window, location) {
${code}
    })(window.kiwi621, parent.document, parent, parent.location);
  } catch (error) {
    console.error("kiwi621: plugin failed", error);
  }`;
}

function frame(code, nonce) {
  const safe = code.replace(/<\/script/gi, "<\\/script");
  const node = document.createElement("iframe");
  node.id = "kiwi621-plugins";
  node.hidden = true;
  node.tabIndex = -1;
  node.setAttribute("sandbox", "allow-scripts allow-same-origin");
  node.setAttribute("aria-hidden", "true");
  node.srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body><script nonce="${nonce.replace(/"/g, "&quot;")}">${safe}</script></body></html>`;
  return node;
}

export async function initPlugins() {
  const plugins = await getPlugins();
  if (!plugins.length) return;

  const loaded = [];
  for (const plugin of plugins) {
    try {
      let code = await getCode(plugin.id);
      if (code === null) {
        code = await text(plugin.url);
        await setCode(plugin.id, code);
      }
      loaded.push(wrap(code));
    } catch (error) {
      console.warn(`kiwi621: could not load plugin ${plugin.name || plugin.id}`, error);
    }
  }

  if (!loaded.length) return;

  const nonce = document.querySelector("script[nonce]")?.nonce || "";
  const node = frame([bridge, ...loaded].join("\n"), nonce);

  window.addEventListener("message", async event => {
    const data = event.data;
    if (!data || data.source !== "kiwi621" || data.kind !== "request" || event.source !== node.contentWindow) return;

    try {
      let value;
      if (data.method === "getSetting") {
        value = await get(data.key, data.value);
      } else if (data.method === "setSetting") {
        await set(data.key, data.value);
      } else if (data.method === "removeSetting") {
        await del(data.key);
      } else if (data.method === "registerRoute") {
        route({
          path: data.value?.path,
          title: data.value?.title,
          sitemap: Boolean(data.value?.sitemap),
          content: data.value?.content || ""
        });
      } else if (data.method === "important") {
        important(data.value);
      } else {
        throw new Error("unknown method");
      }

      event.source.postMessage({ source: "kiwi621", kind: "response", id: data.id, value }, "*");
    } catch (error) {
      event.source.postMessage({ source: "kiwi621", kind: "response", id: data.id, error: error.message }, "*");
    }
  });

  document.documentElement.append(node);
}