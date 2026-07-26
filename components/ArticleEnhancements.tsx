"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the statically-rendered article body: adds a
 * copy button to each code block and copy-link behavior to heading anchors.
 * The content is fully usable without any of this (plan §3.3).
 */
export function ArticleEnhancements() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".article-body");
    if (!root) return;
    const cleanups: (() => void)[] = [];

    // Copy buttons on code blocks.
    root.querySelectorAll<HTMLElement>("figure.code-block").forEach((figure) => {
      const bar = figure.querySelector(".code-block__bar");
      const code = figure.querySelector("pre code");
      if (!bar || !code || bar.querySelector(".code-copy")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? "");
          btn.textContent = "Copied";
          btn.classList.add("is-copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("is-copied");
          }, 1600);
        } catch {
          btn.textContent = "Press ⌘C";
        }
      };
      btn.addEventListener("click", onClick);
      bar.appendChild(btn);
      cleanups.push(() => btn.removeEventListener("click", onClick));
    });

    // Heading anchors copy their canonical URL on click.
    root.querySelectorAll<HTMLAnchorElement>("a.heading-anchor").forEach((a) => {
      const onClick = (e: MouseEvent) => {
        const id = a.getAttribute("href")?.slice(1);
        if (!id) return;
        const url = `${location.origin}${location.pathname}#${id}`;
        if (navigator.clipboard) {
          e.preventDefault();
          history.replaceState(null, "", `#${id}`);
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
          navigator.clipboard.writeText(url).then(
            () => {
              a.classList.add("is-copied");
              setTimeout(() => a.classList.remove("is-copied"), 1200);
            },
            () => {},
          );
        }
      };
      a.addEventListener("click", onClick);
      cleanups.push(() => a.removeEventListener("click", onClick));
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
