(function () {
  const CONTROL_ID = "nav-music-stack-controls";

  function runAction(action) {
    if (!window.anzhiyu) return;
    if (action === "prev" && typeof window.anzhiyu.musicSkipBack === "function") {
      window.anzhiyu.musicSkipBack();
    }
    if (action === "next" && typeof window.anzhiyu.musicSkipForward === "function") {
      window.anzhiyu.musicSkipForward();
    }
  }

  function createButton(label, action, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-music-stack-btn";
    button.setAttribute("aria-label", title);
    button.setAttribute("title", title);
    button.dataset.action = action;
    button.innerHTML = `<span>${label}</span>`;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      runAction(action);
    });
    return button;
  }

  function mountMusicControls() {
    const navMusic = document.getElementById("nav-music");
    if (!navMusic || document.getElementById(CONTROL_ID)) return;

    const controls = document.createElement("div");
    controls.id = CONTROL_ID;
    controls.className = "nav-music-stack-controls";
    controls.appendChild(createButton("˄", "prev", "上一首"));
    controls.appendChild(createButton("˅", "next", "下一首"));
    navMusic.appendChild(controls);
  }

  function init() {
    window.setTimeout(mountMusicControls, 600);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
