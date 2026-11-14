const footer = document.querySelector("footer.footer-wrapper .footer-right");

if (footer && !document.getElementById("kiwi-back2top")) {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "kiwi-back2top";
  button.className = "st-button kiwi-back2top";
  button.textContent = "Back to Top";
  button.addEventListener("click", () => window.scrollTo({ top: 0 }));
  footer.append(button);
}