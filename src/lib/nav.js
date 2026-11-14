const tops = new Map();
const subs = new Map();
let styled = false;
let profiled = false;

const nav = () => document.querySelector("nav.navigation");
const slug = text => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clean = path => String(path).replace(/\/+$/, "") || "/";

const hit = (path, value) => {
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
};

const menu = kind => nav()?.querySelector(kind === "top" ? "menu.nav-help" : "menu.nav-secondary");
const links = kind => kind === "top" ? tops : subs;

function remove(kind, id) {
  const item = links(kind).get(id);
  item?.remove();
  links(kind).delete(id);
}

function add(kind, { id, label, href = "/", title, style, after, before, location = ["*"], onClick } = {}) {
  const target = menu(kind);
  if (!target || !label || (kind === "sub" && !hit(window.location.pathname, location))) return null;

  const key = id || slug(label);
  remove(kind, key);

  const prefix = kind === "top" ? "nav" : "subnav";
  const item = document.createElement("li");
  item.id = `${prefix}-${key}`;
  item.className = `${kind === "top" ? "nav-help" : "subnav"}-${key}`;

  const link = document.createElement("a");
  link.id = `${item.id}-link`;
  link.href = href;
  link.textContent = label;

  if (title) link.title = title;
  if (style) Object.assign(link.style, style);
  if (onClick) link.addEventListener("click", onClick);

  item.append(link);

  const anchor = (after && target.querySelector(after)) || (before && target.querySelector(before));
  if (anchor && after) {
    anchor.after(item);
  } else if (anchor) {
    anchor.before(item);
  } else {
    target.append(item);
  }

  links(kind).set(key, item);
  return item;
}

export const addTop = options => add("top", options);
export const removeTop = id => remove("top", id);
export const addSub = options => add("sub", options);
export const removeSub = id => remove("sub", id);

function flow() {
  const bar = nav();
  const primary = bar?.querySelector("menu.nav-primary");
  const help = bar?.querySelector("menu.nav-help");
  if (!bar || !primary || !help || bar.querySelector(":scope > .kiwi-toplinks")) return;

  const barLinks = document.createElement("div");
  barLinks.className = "kiwi-toplinks";
  primary.before(barLinks);
  barLinks.append(primary, help);
}

function measure() {
  const bar = nav();
  const barLinks = bar?.querySelector(":scope > .kiwi-toplinks");
  const controls = bar?.querySelector("menu.nav-controls");
  if (!bar || !barLinks || !controls) return;

  const space = Math.max(0, Math.ceil(barLinks.getBoundingClientRect().right - controls.getBoundingClientRect().left + 12));
  bar.style.setProperty("--kiwi-profile-reserve", `${space}px`);
}

function watch() {
  const bar = nav();
  const controls = bar?.querySelector("menu.nav-controls");
  if (!bar || !controls || profiled) return;

  profiled = true;
  measure();
  window.addEventListener("resize", measure);
  document.fonts?.ready.then(measure);
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(measure).observe(controls);
  }
}

const css = `body nav.navigation > .kiwi-toplinks { display: contents; }
@media (min-width: 50rem) {
  body nav.navigation {
    grid-template-areas:
      "logo links links links controls"
      "logo secondary secondary tools controls";
    grid-template-columns: min-content min-content minmax(0, 1fr) min-content 4.25rem;
    grid-template-rows: auto auto;
    padding: 0 1rem .5rem !important;
    box-sizing: border-box;
    overflow: visible !important;
  }
  body.c-static.a-home nav.navigation {
    grid-template-areas:
      "logo links links . controls"
      "logo secondary secondary tools controls";
  }
  body.c-static.a-home nav.navigation > .kiwi-toplinks {
    align-self: stretch;
    align-content: center;
  }
  body.c-static.a-home nav.navigation > menu.nav-logo {
    align-self: center;
  }
  body nav.navigation > menu.nav-logo { height: 3.25rem; }
  body nav.navigation > .kiwi-toplinks {
    grid-area: links;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    align-self: start;
    min-width: 0;
    box-sizing: border-box;
    padding-left: .25rem;
    padding-right: var(--kiwi-profile-reserve, 0px);
  }
  body nav.navigation > .kiwi-toplinks > menu.nav-primary,
  body nav.navigation > .kiwi-toplinks > menu.nav-help { display: contents !important; }
  body nav.navigation > .kiwi-toplinks li { display: flex; flex: none; height: 1.5rem; }
  body nav.navigation > menu.nav-secondary {
    grid-area: secondary;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    min-width: 0;
    box-sizing: border-box;
    overflow: visible !important;
  }
  body nav.navigation > menu.nav-secondary:not(:has(li)) {
    display: none !important;
  }
  body nav.navigation > menu.nav-secondary li { display: flex; flex: none; height: 1.5rem; }
}`;

function paint() {
  if (styled || document.getElementById("kiwi621-topfix")) return;
  styled = true;
  const style = document.createElement("style");
  style.id = "kiwi621-topfix";
  style.textContent = css;
  (document.head || document.documentElement).append(style);
}

export function initTopbar() {
  flow();
  paint();
  watch();
}