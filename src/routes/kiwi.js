import { el, get, json, resolve, set, text, theme } from "../lib/core.js";
import { dropCode, getPlugins, setCode, setPlugins } from "../lib/plugins.js";
import kIcon from "../extension/icon.png";

const tabs = [["plugins", "Plugins"], ["themes", "Themes"], ["credits", "Credits"]];

const socials = [
  ["cyanpurr.cc.cd", "https://cyanpurr.cc.cd"],
  ["x.com/cyanpurr", "https://x.com/cyanpurr"],
  ["github.com/cyanpurr", "https://github.com/cyanpurr"],
  ["youtube.com/@cyanpurr", "https://youtube.com/@cyanpurr"],
  ["@cyanpurr on Discord", null]
];

let activeTab = null;

const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function tabNode(tag, tab, cls = "", label) {
  const node = el(tag, cls, label);
  node.dataset.tab = tab;
  node.classList.toggle("active", activeTab === tab);
  return node;
}

function btn(label, cls = "st-button") {
  const node = el("button", cls, label);
  node.type = "button";
  return node;
}

function message(tab, text) {
  const row = tabNode("tab-entry", tab, "blocky");
  const body = el("tab-body");
  body.append(el("p", "", text));
  row.append(body);
  return row;
}

function failure(tab, label, cause, retry) {
  console.warn(`kiwi621: ${label}`, cause);
  const row = message(tab, label);
  const action = btn("Retry");
  action.addEventListener("click", retry);
  row.querySelector("tab-body").append(action);
  return row;
}

function item(tab, data, url, control, updated = false) {
  const row = tabNode("tab-entry", tab, "inline");
  const head = el("tab-head");
  const name = el("strong", "", data.author ? `${data.name || data.id} [${data.author}]` : data.name || data.id);

  if (updated) {
    name.append(el("span", "kiwi-updated", " (Updated)"));
  }

  const body = el("tab-body");
  body.append(control);

  const hint = el("tab-hint", "", data.short ? `${data.short} ` : "");
  const source = el("a", "", "source");
  source.href = url;
  source.rel = "noopener";
  hint.append(source);

  head.append(name);
  row.append(head, body, hint);
  return row;
}

async function loadPlugins(list) {
  list.replaceChildren(message("plugins", "Loading plugins..."));

  try {
    const [library, enabled] = await Promise.all([
      json("plugins.json"), getPlugins()
    ]);
    const installed = new Map(enabled.map(plugin => [plugin.id, plugin]));
    const items = library.filter(data => data?.url);

    list.replaceChildren();

    if (!items.length) {
      list.append(message("plugins", "No plugins available."));
      return;
    }

    for (const data of items) {
      const id = data.id || slug(data.name);
      const url = resolve("plugins.json", data.url);
      const current = installed.get(id);
      const version = data.version || "";
      const updated = Boolean(current && version && current.version !== version);
      const control = btn(current ? updated ? "Update" : "Disable" : "Enable");

      control.addEventListener("click", async () => {
        control.disabled = true;

        try {
          if (current && !updated) {
            const latest = await getPlugins();
            await setPlugins(latest.filter(plugin => plugin.id !== id));
            await dropCode(id);
          } else {
            const code = await text(url);
            await setCode(id, code);
            const latest = await getPlugins();
            await setPlugins([...latest.filter(plugin => plugin.id !== id), { id, name: data.name || id, url, version }]);
          }

          location.reload();
        } catch (cause) {
          console.warn("kiwi621: could not toggle plugin", cause);
          control.disabled = false;
          control.textContent = "Try again";
        }
      });

      const row = item("plugins", data, url, control, updated);
      row.dataset.id = id;
      list.append(row);
    }
  } catch (cause) {
    list.replaceChildren(failure("plugins", "Plugins are unavailable right now.", cause, () => loadPlugins(list)));
  }
}

async function loadThemes(list) {
  list.replaceChildren(message("themes", "Loading themes..."));

  try {
    const [library, active] = await Promise.all([
      json("themes.json"),
      get("theme", null)
    ]);
    const items = library.filter(data => data?.url);

    list.replaceChildren();

    if (!items.length) {
      list.append(message("themes", "No themes available."));
      return;
    }

    for (const data of items) {
      const id = data.id || slug(data.name);
      const url = resolve("themes.json", data.url);
      const control = btn(active?.id === id ? "Remove" : "Apply");

      control.addEventListener("click", async () => {
        control.disabled = true;

        try {
          if (active?.id === id) {
            await set("theme", null);
            theme("");
          } else {
            const css = await text(url);
            await set("theme", { id, name: data.name || id, css });
            theme(css);
          }

          await loadThemes(list);
        } catch (cause) {
          console.warn("kiwi621: could not toggle theme", cause);
          control.disabled = false;
          control.textContent = "Try again";
        }
      });

      const row = item("themes", data, url, control);
      row.dataset.id = id;
      list.append(row);
    }
  } catch (cause) {
    list.replaceChildren(failure("themes", "Themes are unavailable right now.", cause, () => loadThemes(list)));
  }
}

function credits(list) {
  const info = tabNode("tab-entry", "credits", "blocky");
  const body = el("tab-body");

  const repo = el("p");
  const repoLink = el("a", "", "GitHub repository");
  repoLink.href = "https://github.com/cyanpurr/kiwi621";
  repoLink.rel = "noopener";
  repo.append(repoLink);

  const social = el("div", "kiwi-socials");
  social.append(el("p", "", "Made by cyanpurr."));

  const socialList = el("ul");

  for (const [label, href] of socials) {
    const entry = el("li");

    if (href) {
      const link = el("a", "", label);
      link.href = href;
      link.rel = "noopener";
      entry.append(link);
    } else {
      entry.textContent = label;
    }

    socialList.append(entry);
  }

  social.append(socialList);

  const reset = btn("oooh! a nuke button!", "st-button danger kiwi-reset");
  reset.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset kiwi621?")) {
      location.assign("/kiwi/reset");
    }
  });

  body.append(repo, social, reset);
  info.append(body);
  list.append(info);
}

const css = `#a-kiwi .kiwi-logo {
  display: block;
  width: 8rem;
  height: 8rem;
  object-fit: contain;
  margin: .25rem 0 .5rem;
}
#a-kiwi .kiwi-logo[hidden] {
  display: none;
}
#a-kiwi .kiwi-socials,
#a-kiwi .kiwi-reset {
  margin-top: 1rem;
}
#a-kiwi .kiwi-updated {
  color: lime;
  font-weight: bold;
}`;

export default function kiwi() {
  const root = el("div");
  root.id = "c-static";

  const page = el("div");
  page.id = "a-kiwi";

  const style = el("style");
  style.textContent = css;

  const heading = el("h1", "", "kiwi621");
  const menu = el("tabs-menu");
  menu.id = "kiwi-tabs";
  menu.setAttribute("role", "tablist");

  const content = el("tabs-content");
  content.setAttribute("for", "kiwi-tabs");

  const logo = el("img", "kiwi-logo");
  logo.alt = "kiwi621";
  logo.src = kIcon;

  const buttons = {};
  const lists = {};

  const select = id => {
    if (id && !buttons[id]) {
      return;
    }

    activeTab = id;

    for (const [key, node] of Object.entries(buttons)) {
      const active = key === id;
      node.classList.toggle("active", active);
      node.setAttribute("aria-selected", String(active));
    }

    for (const node of content.querySelectorAll("[data-tab]")) {
      node.classList.toggle("active", node.dataset.tab === id);
    }

    logo.hidden = Boolean(id);
  };

  for (const [id, label] of tabs) {
    const tab = btn(label);
    tab.name = id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.addEventListener("click", () => select(id));
    buttons[id] = tab;
    menu.append(tab);

    content.append(tabNode("tab-group", id, "", label));
    const list = el("div", "kiwi-list");
    lists[id] = list;
    content.append(list);
  }

  loadPlugins(lists.plugins);
  loadThemes(lists.themes);
  credits(lists.credits);

  page.append(style, heading, menu, logo, content);
  root.append(page);
  select(null);

  return { title: "kiwi621", content: root };
}