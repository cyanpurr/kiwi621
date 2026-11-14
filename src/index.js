import { clear, del as removeSetting, el, get, initTheme, set } from "./lib/core.js";
import { important } from "./lib/dialog.js";
import { addSub, addTop, initTopbar, removeSub, removeTop } from "./lib/nav.js";
import { initPlugins } from "./lib/plugins.js";
import { initRouter, route } from "./lib/router.js";
import kiwi from "./routes/kiwi.js";

const page = (id, text) => {
  const root = el("div");
  root.id = "c-static";
  const box = el("div");
  box.id = id;
  box.append(el("h1", "", text));
  root.append(box);
  return root;
};

const hello = () => page("a-kiwi-hello", "Hello, World!");
const reset = () => {
  const view = page("a-kiwi-reset", "Resetting kiwi621...");
  clear().finally(() => location.replace("/"));
  return view;
};

route({ path: "/kiwi", title: "kiwi621", content: kiwi, sitemap: true });
route({ path: "/kiwi/hello", title: "Hello", content: hello });
route({ path: "/kiwi/reset", title: "Reset", content: reset });

addTop({
  id: "kiwi621", label: "kiwi621", href: "/kiwi",
  title: "kiwi621", after: ".nav-help-map",
  style: { color: "lime", fontWeight: "bold" }
});

window.kiwi621 = {
  addTopLink: addTop,
  removeTopLink: removeTop,
  addSubLink: addSub,
  removeSubLink: removeSub,
  addRoute: route,
  important,
  getSetting: get,
  setSetting: set,
  removeSetting
};

initRouter();
initTopbar();
initTheme();
initPlugins();