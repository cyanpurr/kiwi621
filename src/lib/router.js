const routes = new Map();
let mounted = null;
let started = false;

const clean = path => path.replace(/\/+$/, "") || "/";
const site = () => location.hostname.split(".")[0] || "e621";

function make(route, render) {
  if (typeof route === "string") {
    return { path: route, title: "", content: render, sitemap: false };
  }
  return {
    path: route.path,
    title: route.title || "",
    content: route.content,
    sitemap: Boolean(route.sitemap)
  };
}

function view(route) {
  const value = typeof route.content === "function" ? route.content() : route.content;
  if (value?.content) {
    return { title: value.title || route.title, content: value.content };
  }
  if (value?.nodeType) {
    return { title: route.title, content: value };
  }

  const box = document.createElement("div");
  if (typeof value === "string") {
    box.innerHTML = value;
  } else if (Array.isArray(value)) {
    box.append(...value);
  } else {
    box.textContent = value == null ? "" : String(value);
  }
  return { title: route.title, content: box };
}

function show(route) {
  const page = document.querySelector("#page");
  if (!page) return;

  const content = view(route);
  if (!mounted) {
    mounted = {
      box: document.createElement("div"),
      hidden: Array.from(page.children),
      title: document.title
    };
    mounted.box.id = "kiwi621-page";
    for (const child of mounted.hidden) {
      child.hidden = true;
    }
    page.append(mounted.box);
  }

  mounted.box.replaceChildren(content.content);
  document.title = content.title ? `${content.title} - ${site()}` : mounted.title;
}

function hide() {
  if (!mounted) return;
  mounted.box.remove();
  for (const child of mounted.hidden) {
    child.hidden = false;
  }
  document.title = mounted.title;
  mounted = null;
}

function map() {
  const host = document.querySelector("#a-site-map");
  if (!host) return;

  let section = document.getElementById("kiwi621-site-map");
  if (!section) {
    section = document.createElement("section");
    section.id = "kiwi621-site-map";
    host.append(section);
  }

  const heading = document.createElement("h3");
  heading.textContent = "kiwi621";
  heading.style.color = "lime";

  const list = document.createElement("ul");
  for (const route of routes.values()) {
    if (!route.sitemap) continue;

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = route.path;
    link.textContent = route.title || route.path;
    item.append(link);
    list.append(item);
  }

  section.replaceChildren(heading, list);
}

export function route(value, render) {
  const item = make(value, render);
  if (!item.path) return;

  const key = clean(item.path);
  routes.set(key, item);
  map();

  if (started && clean(location.pathname) === key) {
    show(item);
  }
}

export function initRouter() {
  if (started) return;
  started = true;

  const current = routes.get(clean(location.pathname));
  if (current) {
    show(current);
  } else {
    hide();
  }
  map();
}