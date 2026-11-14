import { el } from "./core.js";

let open = null;
let seq = 0;

function fill(node, content) {
  if (content == null) return;
  if (typeof content === "string") {
    node.insertAdjacentHTML("beforeend", content);
  } else if (content.nodeType) {
    node.append(content);
  } else if (Array.isArray(content)) {
    content.forEach(item => fill(node, item));
  } else {
    node.append(String(content));
  }
}

export function important({ title = "Important", content = "", buttons = [] } = {}) {
  if (open) open();

  const id = ++seq;
  const box = el("div", "tos-modal-container");
  box.dataset.kiwiImportant = "";

  const dialog = el("div", "tos-modal");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", `kiwi621-important-title-${id}`);
  dialog.setAttribute("aria-describedby", `kiwi621-important-text-${id}`);

  const heading = el("h1", "tos-modal-header", title);
  heading.id = `kiwi621-important-title-${id}`;

  const contentBox = el("div", "tos-modal-content");
  const text = el("div", "tos-modal-text");
  text.id = `kiwi621-important-text-${id}`;
  fill(text, content);

  const footer = el("div", "tos-modal-footer");

  const close = () => {
    document.removeEventListener("keydown", key);
    box.remove();
    document.body.classList.remove("scroll-lock");
    if (open === close) open = null;
  };

  const key = event => {
    if (event.key === "Escape") close();
  };

  for (const item of Array.isArray(buttons) && buttons.length ? buttons : [{ label: "OK" }]) {
    const data = typeof item === "string" ? { label: item } : item;
    const button = el("button", "st-button", data.label || "OK");
    button.type = "button";

    if (data.className) button.className += ` ${data.className}`;
    if (data.style) Object.assign(button.style, data.style);

    button.addEventListener("click", () => {
      if (data.onClick && data.onClick() === false) return;
      close();
    });

    footer.append(button);
  }

  contentBox.append(text);
  dialog.append(heading, contentBox, footer);
  box.append(dialog);
  document.body.classList.add("scroll-lock");
  document.addEventListener("keydown", key);
  document.body.append(box);

  open = close;
  return close;
}