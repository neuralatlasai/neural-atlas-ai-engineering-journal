import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("public/interactive/habitat/runtime.js", "utf8");

/** Minimal DOM/SMIL boundary exercises the shipped runtime and real click listeners. */
function flowFixture(reducedMotion: boolean) {
  class Control extends EventTarget {
    disabled = false;
    textContent = "";
    attributes = new Map<string, string>();
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  }
  const toggle = new Control();
  const replay = new Control();
  const svg = {
    paused: true,
    time: 5,
    querySelector: () => ({}),
    pauseAnimations() { this.paused = true; },
    unpauseAnimations() { this.paused = false; },
    setCurrentTime(time: number) { this.time = time; },
  };
  const figure = {
    dataset: { state: "paused" },
    querySelectorAll: () => [svg],
    querySelector: (selector: string) => selector.includes("toggle-motion") ? toggle : replay,
  };
  const frameWindow = Object.assign(new EventTarget(), { postMessage() {} });
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    documentElement: { dataset: { theme: "light" } },
    body: { dataset: { figureKind: "request-flow" } },
    querySelector: (selector: string) => selector === "figure" ? figure
      : { getBoundingClientRect: () => ({ height: 400 }) },
  });
  const context = vm.createContext({
    document, window: frameWindow, parent: frameWindow,
    matchMedia: (query: string) => Object.assign(new EventTarget(), {
      matches: query.includes("reduced-motion") && reducedMotion,
    }),
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    console,
  });
  vm.runInContext(source, context);
  const controller = vm.runInContext("controller", context) as {
    configure(value: { active: boolean; reducedMotion: boolean }): void;
  };
  return { toggle, replay, svg, figure, controller };
}

describe("interactive playback preferences", () => {
  it("starts paused and lets a reduced-motion reader explicitly choose Play", () => {
    const fixture = flowFixture(true);
    assert.equal(fixture.svg.paused, true);
    assert.equal(fixture.toggle.disabled, false);
    fixture.toggle.dispatchEvent(new Event("click"));
    assert.equal(fixture.svg.paused, false);
    assert.equal(fixture.figure.dataset.state, "playing");
    fixture.toggle.dispatchEvent(new Event("click"));
    assert.equal(fixture.svg.paused, true);
  });

  it("preserves explicit playback through visibility and theme updates", () => {
    const fixture = flowFixture(true);
    fixture.toggle.dispatchEvent(new Event("click"));
    fixture.controller.configure({ active: false, reducedMotion: true });
    assert.equal(fixture.svg.paused, true);
    fixture.controller.configure({ active: true, reducedMotion: true });
    assert.equal(fixture.svg.paused, false);
  });

  it("honors a new reduced-motion preference until the reader opts in again", () => {
    const fixture = flowFixture(false);
    fixture.toggle.dispatchEvent(new Event("click"));
    fixture.controller.configure({ active: true, reducedMotion: true });
    assert.equal(fixture.svg.paused, true);
    assert.equal(fixture.toggle.textContent, "Play");
    fixture.replay.dispatchEvent(new Event("click"));
    assert.equal(fixture.svg.time, 0);
    assert.equal(fixture.svg.paused, false);
  });
});
