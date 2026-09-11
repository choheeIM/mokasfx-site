/* Moka Light shared browser helpers. */
(function () {
  "use strict";

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const createRafScheduler = (callback) => {
    let frame = 0;
    const request = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        callback();
      });
    };
    request.cancel = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    return request;
  };

  window.MokaLightUtils = Object.freeze({ onReady, clamp, createRafScheduler });
})();

