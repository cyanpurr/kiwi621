const path = location.pathname.replace(/\/+$/, "");
const profile = document.querySelector("#c-users #a-show .user-card-name a");
const tabs = document.getElementById("profile-tabs");

if (profile && tabs && /^\/users\/[^/]+$/.test(path) && !document.getElementById("kiwi-usernote")) {
  const target = new URL(profile.getAttribute("href"), location.href).pathname.replace(/\/+$/, "");
  const setting = `usernote:${location.hostname}:${target}`;

  const style = document.createElement("style");
  style.id = "kiwi-usernote-style";
  style.textContent = `#kiwi-usernote{display:flex;align-items:center;gap:1rem;margin-bottom:1rem;padding:.5rem .75rem;background:var(--color-section);border-radius:.25rem;box-sizing:border-box}#kiwi-usernote label{font-weight:bold;font-size:.9rem;white-space:nowrap}#kiwi-usernote textarea{flex:1;box-sizing:border-box;height:4rem;min-height:4rem;max-height:8rem;resize:vertical;padding:.35rem .5rem;border:1px solid var(--color-section-darken-5);border-radius:.25rem;background:var(--color-foreground);color:var(--color-text);font:inherit;line-height:1.2}#kiwi-usernote textarea:focus{outline:2px solid var(--color-link);outline-offset:1px}#kiwi-usernote .kiwi-usernote-meta{font-size:.8rem;color:var(--color-text-muted);white-space:nowrap}`;
  const nonce = document.querySelector("script[nonce]")?.nonce;
  if (nonce) style.nonce = nonce;
  document.head.append(style);

  const section = document.createElement("section");
  section.id = "kiwi-usernote";

  const label = document.createElement("label");
  label.htmlFor = "kiwi-usernote-text";
  label.textContent = "User Note";

  const area = document.createElement("textarea");
  area.id = "kiwi-usernote-text";
  area.rows = 1;
  area.placeholder = "This user is pretty nice...";

  const meta = document.createElement("div");
  meta.className = "kiwi-usernote-meta";

  const status = document.createElement("span");
  status.setAttribute("aria-live", "polite");

  meta.append(status);
  section.append(label, area, meta);

  let timer;
  let version = 0;
  let saves = Promise.resolve();

  const persist = () => {
    window.clearTimeout(timer);
    timer = null;
    const value = area.value.trim();
    const current = ++version;
    status.textContent = "Saving...";
    saves = saves
      .then(() => value ? kiwi621.setSetting(setting, value) : kiwi621.removeSetting(setting))
      .then(() => {
        if (current === version) status.textContent = "Saved";
      })
      .catch(() => {
        if (current === version) status.textContent = "Could not save";
      });
  };

  area.addEventListener("input", () => {
    status.textContent = "";
    window.clearTimeout(timer);
    timer = window.setTimeout(persist, 300);
  });
  area.addEventListener("blur", persist);
  window.addEventListener("pagehide", () => {
    if (timer) persist();
  });

  kiwi621.getSetting(setting, "").then(value => {
    area.value = typeof value === "string" ? value : "";
    tabs.before(section);
  });
}