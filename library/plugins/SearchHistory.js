const path = location.pathname.replace(/\/+$/, "") || "/";

if (path === "/" || path.startsWith("/posts")) {
  const form = document.querySelector("#home-search-form, form.post-search-form");
  const input = form?.querySelector("#tags");
  const setting = `search-history:${location.hostname}`;
  let history = [];
  let timer;

  const dropdown = document.createElement("ul");
  dropdown.id = "kiwi-search-history";
  dropdown.className = "ui-autocomplete-dropdown";
  dropdown.style.display = "none";
  dropdown.setAttribute("role", "listbox");
  dropdown.setAttribute("aria-label", "Search History");

  const position = () => {
    if (!input) return;
    const rect = input.parentElement.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.left = `${rect.left + window.scrollX + 1}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.minWidth = `${rect.width}px`;
  };

  const hide = () => {
    dropdown.style.display = "none";
    selected = -1;
    input?.setAttribute("aria-expanded", "false");
  };

  const show = () => {
    if (!input || !history.length || input.value.trim()) {
      hide();
      return;
    }
    position();
    dropdown.style.display = "block";
    input.setAttribute("aria-expanded", "true");
  };

  const render = () => {
    selected = -1;
    dropdown.replaceChildren();
    history.forEach((query, index) => {
      const item = document.createElement("li");
      item.dataset.index = String(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");

      const link = document.createElement("a");
      link.href = `/posts?tags=${encodeURIComponent(query)}`;
      link.textContent = query;
      link.addEventListener("click", hide);

      item.append(link);
      dropdown.append(item);
    });
    if (!history.length) hide();
  };

  const style = document.createElement("style");
  style.id = "kiwi-searchhistory";
  style.textContent = `.kiwi-searchhistory-clear{flex-basis:100%;order:3;appearance:none;background:none;border:0;margin:0;padding:.25rem 0;font-family:inherit;font-size:.85rem;line-height:1rem;color:var(--color-link);text-align:left;cursor:pointer}.kiwi-searchhistory-clear:hover,.kiwi-searchhistory-clear:focus{color:var(--color-link-hover)}`;
  const nonce = document.querySelector("script[nonce]")?.nonce;
  if (nonce) style.nonce = nonce;
  document.head.append(style);

  const clear = async () => {
    history = [];
    await kiwi621.removeSetting(setting);
    render();
    hide();
  };

  for (const footer of document.querySelectorAll(".post-index .blacklist-footer")) {
    if (footer.querySelector(".kiwi-searchhistory-clear")) continue;
    footer.style.flexWrap = "wrap";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kiwi-searchhistory-clear";
    button.textContent = "Clear Search History";
    button.addEventListener("click", clear);
    const toggle = footer.querySelector(".blacklist-toggle-all");
    if (toggle) toggle.after(button);
    else footer.append(button);
  }

  if (input) {
    document.body.append(dropdown);
    input.setAttribute("aria-controls", dropdown.id);
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    dropdown.addEventListener("mousedown", event => event.preventDefault());

    input.addEventListener("focus", () => {
      window.clearTimeout(timer);
      if (!input.value.trim()) show();
    });

    input.addEventListener("input", () => {
      if (input.value.trim()) hide();
      else show();
    });

    input.addEventListener("blur", () => {
      timer = window.setTimeout(hide, 150);
    });

    input.addEventListener("keydown", event => {
      if (dropdown.style.display === "none") return;

      if (event.key === "Escape") {
        event.preventDefault();
        hide();
      }
    });

    window.addEventListener("scroll", () => {
      if (dropdown.style.display !== "none") position();
    }, { passive: true });
    window.addEventListener("resize", () => {
      if (dropdown.style.display !== "none") position();
    });
  }

  (async () => {
    const stored = await kiwi621.getSetting(setting, []);
    history = (Array.isArray(stored) ? stored : [])
      .filter(item => typeof item === "string" && item.trim())
      .map(item => item.trim())
      .slice(0, 10);

    if (path === "/posts") {
      const query = new URLSearchParams(location.search).get("tags")?.trim();
      if (query) {
        history = [query, ...history.filter(item => item !== query)].slice(0, 10);
        await kiwi621.setSetting(setting, history);
      }
    }

    render();
    if (input) {
      if (!input.value.trim() && (path === "/" || document.activeElement === input)) show();
      window.setTimeout(() => {
        if (dropdown.style.display !== "none") position();
      }, 0);
    }
  })();
}