/**
 * Progressive enhancement for local, opaque-origin figure frames. Only the
 * exact iframe window can report its size; no frame receives same-origin access.
 * Indexing once keeps messages O(1); all observers, listeners and timers clean up.
 */
export function enhanceInteractiveFigures(root: HTMLElement): () => void {
  const frames = Array.from(
    root.querySelectorAll<HTMLIFrameElement>("iframe[data-interactive-frame]"),
  );
  if (frames.length === 0) return () => {};
  const windows = new Map<MessageEventSource, HTMLIFrameElement>();
  const timeouts = new Map<HTMLIFrameElement, ReturnType<typeof setTimeout>>();
  const visible = new Set<HTMLIFrameElement>();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const configure = (frame: HTMLIFrameElement) => {
    frame.contentWindow?.postMessage({
      type: "neural-atlas:figure-config",
      theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      active: visible.has(frame) && !document.hidden,
      reducedMotion: reduced.matches,
    }, "*");
  };
  const configureAll = () => frames.forEach(configure);
  const startFrame = (frame: HTMLIFrameElement) => {
    if (frame.dataset.state) return;
    const src = frame.dataset.src;
    if (!src) return;
    frame.dataset.state = "loading";
    frame.hidden = false;
    frame.loading = "eager";
    if (frame.contentWindow) windows.set(frame.contentWindow, frame);
    frame.src = src;
    timeouts.set(frame, setTimeout(() => {
      if (frame.dataset.state !== "ready") {
        frame.hidden = true;
        frame.dataset.state = "unavailable";
      }
      timeouts.delete(frame);
    }, 20_000));
  };
  const onMessage = (event: MessageEvent<unknown>) => {
    const frame = event.source ? windows.get(event.source) : undefined;
    if (!frame || !event.data || typeof event.data !== "object") return;
    const data = event.data as Record<string, unknown>;
    if (data.type !== "neural-atlas:figure-ready") return;
    if (typeof data.height !== "number" || !Number.isFinite(data.height)) return;
    if (data.height < 100 || data.height > 6000) return;
    frame.style.height = `${Math.ceil(data.height)}px`;
    frame.hidden = false;
    const fallback = frame.parentElement?.querySelector<HTMLElement>(".interactive-figure__fallback");
    if (fallback) fallback.hidden = true;
    clearTimeout(timeouts.get(frame));
    timeouts.delete(frame);
    frame.dataset.state = "ready";
    configure(frame);
  };
  window.addEventListener("message", onMessage);
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const frame = entry.target.querySelector<HTMLIFrameElement>("iframe[data-interactive-frame]");
      if (!frame) continue;
      if (entry.isIntersecting) {
        visible.add(frame);
        startFrame(frame);
      }
      else visible.delete(frame);
      configure(frame);
    }
  });
  const themeObserver = new MutationObserver(configureAll);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("visibilitychange", configureAll);
  reduced.addEventListener("change", configureAll);
  for (const frame of frames) {
    if (frame.parentElement) observer.observe(frame.parentElement);
  }
  return () => {
    window.removeEventListener("message", onMessage);
    document.removeEventListener("visibilitychange", configureAll);
    reduced.removeEventListener("change", configureAll);
    observer.disconnect();
    themeObserver.disconnect();
    timeouts.forEach(clearTimeout);
    for (const frame of frames) {
      frame.removeAttribute("src");
      delete frame.dataset.state;
      frame.hidden = true;
      const fallback = frame.parentElement?.querySelector<HTMLElement>(".interactive-figure__fallback");
      if (fallback) fallback.hidden = false;
    }
  };
}
