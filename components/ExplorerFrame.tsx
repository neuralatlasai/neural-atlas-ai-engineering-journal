"use client";

import { useEffect, useRef, useState } from "react";

/** Child messages are accepted only from this frame, with bounded dimensions. */
export function ExplorerFrame({ src, title, views }: {
  src: string;
  title: string;
  views: readonly string[];
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2400);
  useEffect(() => {
    let firstMessage = true;
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    const sendTheme = () => frame.current?.contentWindow?.postMessage({
      type: "neural-atlas:theme",
      theme: document.documentElement.dataset.theme || (scheme.matches ? "dark" : "light"),
    }, "*");
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data || typeof event.data !== "object") return;
      if (event.data.type !== "neural-atlas:explorer") return;
      if (Number.isFinite(event.data.height) && event.data.height >= 400 && event.data.height <= 16000) {
        setHeight(Math.ceil(event.data.height));
      }
      // The initial model render must not erase a deep link before navigation.
      if (firstMessage) { firstMessage = false; navigate(); sendTheme(); }
      else if (typeof event.data.view === "string" && views.includes(event.data.view)) {
        const hash = event.data.view === "model" ? "" : `#${event.data.view}`;
        if (location.hash !== hash) history.replaceState(history.state, "", `${location.pathname}${location.search}${hash}`);
      }
    };
    const navigate = () => {
      const view = location.hash.slice(1) || "model";
      if (views.includes(view)) frame.current?.contentWindow?.postMessage({ type: "neural-atlas:view", view }, "*");
    };
    const loaded = () => { navigate(); sendTheme(); };
    const observer = new MutationObserver(sendTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("message", receive);
    window.addEventListener("hashchange", navigate);
    scheme.addEventListener("change", sendTheme);
    const element = frame.current;
    element?.addEventListener("load", loaded);
    loaded();
    return () => {
      observer.disconnect();
      window.removeEventListener("message", receive);
      window.removeEventListener("hashchange", navigate);
      scheme.removeEventListener("change", sendTheme);
      element?.removeEventListener("load", loaded);
    };
  }, [views]);
  return <iframe ref={frame} className="explorer-frame" src={src} title={title}
    sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox"
    referrerPolicy="no-referrer" style={{ height }} />;
}
