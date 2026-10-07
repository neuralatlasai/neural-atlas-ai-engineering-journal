/* Hosting bridge: no parent DOM access; source-checked messages on both sides. */
(() => {
  "use strict";
  const root = document.getElementById("model-atlas");
  const board = document.getElementById("atlas-stage");
  if (!root || !board) return;
  const embedded = parent !== window;
  const knownViews = new Set((window.ModelAtlas?.views || []).map(({ id }) => id));
  let lastHeight = 0;
  let lastView = "";
  let scheduled = false;
  const report = () => {
    scheduled = false;
    // View navigation can scroll the child before its new height reaches the
    // parent. Measure in document coordinates so that scroll never crops it.
    const height = Math.ceil(root.getBoundingClientRect().bottom + window.scrollY + 12);
    const view = board.querySelector("svg")?.dataset.view || "model";
    if (embedded && (height !== lastHeight || view !== lastView)) {
      lastHeight = height; lastView = view;
      parent.postMessage({ type: "neural-atlas:explorer", height, view }, "*");
    }
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(report); }
  };
  window.addEventListener("message", (event) => {
    if (!embedded || event.source !== parent || !event.data || typeof event.data !== "object") return;
    if (event.data.type === "neural-atlas:theme" && ["light", "dark"].includes(event.data.theme)) {
      document.documentElement.dataset.theme = event.data.theme;
      // The first height notification can precede parent hydration. Reply to
      // its handshake even when the document dimensions have not changed.
      lastHeight = 0;
      schedule();
    }
    if (event.data.type === "neural-atlas:view" && knownViews.has(event.data.view)) {
      const tab = root.querySelector(`.atlas-tab[data-view="${event.data.view}"]`);
      if (tab && tab.getAttribute("aria-current") !== "page") tab.click();
    }
  });
  if (!embedded) {
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    const theme = () => { document.documentElement.dataset.theme = scheme.matches ? "dark" : "light"; };
    theme(); scheme.addEventListener("change", theme);
  }
  let zoom = 1;
  const controls = document.createElement("div");
  controls.className = "atlas-zoom";
  controls.setAttribute("aria-label", "Diagram magnification");
  controls.innerHTML = '<button type="button" class="atlas-control" data-zoom="out" aria-label="Zoom diagram out">−</button><output aria-live="polite">100%</output><button type="button" class="atlas-control" data-zoom="in" aria-label="Zoom diagram in">+</button><button type="button" class="atlas-link-button" data-zoom="fit">Fit</button>';
  root.querySelector(".atlas-toolbar")?.appendChild(controls);
  const applyZoom = () => {
    const svg = board.querySelector("svg");
    if (svg) svg.style.width = `${zoom * 100}%`;
    board.dataset.zoomed = String(zoom > 1);
    controls.querySelector("output").textContent = `${Math.round(zoom * 100)}%`;
    controls.querySelector('[data-zoom="out"]').disabled = zoom <= 1;
    controls.querySelector('[data-zoom="in"]').disabled = zoom >= 2;
    schedule();
  };
  controls.addEventListener("click", (event) => {
    const action = event.target.closest("[data-zoom]")?.dataset.zoom;
    if (!action) return;
    zoom = action === "fit" ? 1 : Math.max(1, Math.min(2, zoom + (action === "in" ? .25 : -.25)));
    applyZoom();
  });
  new MutationObserver(applyZoom).observe(board, { childList: true });
  new ResizeObserver(schedule).observe(root);
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  applyZoom();
})();
