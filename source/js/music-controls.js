(function () {
  function isTypingTarget(target) {
    if (!target) return false;
    const tagName = target.tagName;
    return (
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      target.isContentEditable
    );
  }

  function getAPlayer() {
    const meting = document.querySelector("#nav-music meting-js");
    return meting && meting.aplayer ? meting.aplayer : null;
  }

  function skip(direction) {
    const player = getAPlayer();
    if (!player || !player.list || !player.list.audios || !player.list.audios.length) return false;

    if (direction === "prev" && typeof player.skipBack === "function") {
      player.skipBack();
      return true;
    }

    if (direction === "next" && typeof player.skipForward === "function") {
      player.skipForward();
      return true;
    }

    return false;
  }

  function bindWheelSwitch() {
    const navMusic = document.getElementById("nav-music");
    if (!navMusic || navMusic.dataset.scrollSwitchBound === "true") return;

    navMusic.dataset.scrollSwitchBound = "true";
    navMusic.setAttribute("title", "滚轮切歌，Alt+↑ 上一首，Alt+↓ 下一首");

    navMusic.addEventListener(
      "wheel",
      function (event) {
        if (!getAPlayer()) return;
        event.preventDefault();
        if (event.deltaY < 0) {
          skip("prev");
        } else if (event.deltaY > 0) {
          skip("next");
        }
      },
      { passive: false }
    );
  }

  function bindKeyboardSwitch() {
    if (window.__navMusicKeyboardBound) return;
    window.__navMusicKeyboardBound = true;

    document.addEventListener("keydown", function (event) {
      if (isTypingTarget(event.target) || !event.altKey) return;

      if (event.key === "ArrowUp") {
        if (skip("prev")) event.preventDefault();
      } else if (event.key === "ArrowDown") {
        if (skip("next")) event.preventDefault();
      }
    });
  }

  function init() {
    window.setTimeout(function () {
      bindWheelSwitch();
      bindKeyboardSwitch();
    }, 800);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
