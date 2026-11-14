const button = document.querySelector(".video-player media-playback-rate-button.rate-button");

if (button && !button.hasAttribute("data-morespeeds")) {
  button.setAttribute("rates", "0.1 0.25 0.5 0.75 1 1.25 1.5 1.75 2 3 5 10");
  button.setAttribute("data-morespeeds", "");
}