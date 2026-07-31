"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the statically-rendered article body: adds a
 * copy button to each code block.
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
      const payloadLabel =
        figure.dataset.layout === "diagram" ? "diagram" : "code";
      btn.setAttribute("aria-label", `Copy ${payloadLabel} to clipboard`);
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

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
