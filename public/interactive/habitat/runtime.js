/**
 * Adapted from the DOM simulation controller in the user-supplied OpenAI article.
 * Source: https://openai.com/index/scaling-storage-one-billion-users-part-one/
 * The original, bounded traces are explanatory simulations, not production telemetry.
 * Next/React/analytics dependencies are excluded. Motion starts only on reader request,
 * pauses offscreen, respects reduced motion, and owns an explicit cleanup lifecycle.
 */
"use strict";
const m = (e, t, r) => Math.min(r, Math.max(t, e));
const g = (e, t) => ((e % t) + t) % t;
function f(e, t) {
  let r = e.querySelector(t);
  if (!r) throw Error(`Missing Habitat diagram element: ${t}`);
  return r;
}
function y(e, t) {
  e.textContent !== t && (e.textContent = t);
}
function v(e, t) {
  e.dataset.diagramTooltip !== t &&
    ((e.dataset.diagramTooltip = t), (e.title = t));
}
function x(e, t, r, n) {
  let a = document.createElement(t === "h4" ? "h3" : t);
  return (
    (a.className = r),
    void 0 !== n && (a.textContent = n),
    e.appendChild(a),
    a
  );
}
const b = ["A", "B", "C"];
const w = b.flatMap((e) => [1, 2, 3].map((t) => `${e}${t}`));
const k = Array.from({ length: 18 }, (e, t) => 1600 + 600 * t);
const j = [
  { phase: 0, start: 0, inspect: 200 },
  { phase: 2, start: k[0], inspect: 4400 },
  { phase: 3, start: 11850, inspect: 11850 },
];
function q(e) {
  return Math.min(11850, g(e, 72700) / 6);
}
const C = ["direct", "pooled", "http2"];
const S = [0, 3, 1, 5, 2, 4];
function E(e) {
  return {
    mode: e,
    requests: [],
    connections: [],
    activeRequests: [],
    podPeaks: Array(6).fill(0),
    nextArrival: 0,
    nextId: 1,
    lastElapsed: -1 / 0,
  };
}
function N(e, t) {
  let r = e.connections[t];
  return "direct" === e.mode
    ? (((r.owner ?? 0) + (r.ownerIndex + 0.5) / 3) / 6) * 100
    : ((t + 0.5) / ("http2" === e.mode ? 1 : 6)) * 100;
}
function A(e, t) {
  return e.replace(/\{(\w+)\}/g, (e, r) =>
    Object.hasOwn(t, r) ? String(t[r]) : e,
  );
}
function P(e, t, r = {}) {
  return A(1 === t ? e.one : e.other, { ...r, count: t });
}
function I(e) {
  return {
    request: e.phases.requestProcessing,
    send: e.phases.networkWrite,
    cosmos: e.phases.waitingForCosmos,
    receive: e.phases.networkRead,
    response: e.phases.responseProcessing,
    ready: e.phases.responseBlocked,
    queued: e.phases.waitingForPython,
  };
}
const copyText = {
  playback: {
    complete: "Complete",
    playAnimation: "Play animation",
    pauseAnimation: "Pause animation",
    play: "Play",
    pause: "Pause",
  },
  phases: {
    requestProcessing: "CPU request processing",
    networkWrite: "Python network write",
    waitingForCosmos: "Waiting for Cosmos response",
    networkRead: "Python network read",
    responseProcessing: "CPU response processing",
    responseBlocked: "Response ready, waiting for Python",
    waitingForPython: "Waiting for Python",
    cpuRequest: "CPU request",
    cpuResponse: "CPU response",
    cosmos: "Cosmos",
    readyBlocked: "Ready · blocked",
    complete: "Complete",
  },
  scenarios: {
    timeAxis: "Time →",
    pythonThread: "Python thread",
    pythonThreadDescription:
      "One Python thread executes CPU work from requests A, B, and C.",
    segmentDescription:
      "Request {request}: {phase}, {start}–{end} illustrative units.",
    request: "Request {request}",
    cosmosSocketDescription:
      "Response for request {request} reaches the socket at {time} illustrative units.",
    pythonStatus: "Python: request {request} · {phase}",
    allRequestsComplete: "Python: all three requests complete",
    pythonIdle: "Python is idle while requests wait for Cosmos",
    responseBlocked:
      "{requests}: response already at the socket, but Python cannot receive it yet.",
    finished: "All requests finished at {time} units.",
    fixedWait: "Each Cosmos request has the same fixed illustrative I/O wait.",
    direct: {
      heading: "Direct from Python",
      description:
        "Separate pools keep each pod’s peak. After all 6 pods peak at 3 requests: 18 connections stay open, but only 6 are busy.",
    },
    pooled: {
      heading: "Envoy pools HTTP/1 connections",
      description:
        "One shared pool grows to the fleet’s peak: 6 connections. Steady traffic reuses each connection as soon as its response returns.",
    },
    http2: {
      heading: "Envoy upgrades to HTTP/2",
      description:
        "At steady load, the same 6 requests share 1 retained HTTP/2 connection, each on its own concurrent stream.",
    },
  },
  timeControl: { readout: "{value} / 40 illustrative units" },
  diagram: {
    requests: "Requests →",
    pythonPods: "Python pods",
    pod: "Pod {pod}",
    initialPodStatus: "0 active · peak 0",
    localTraffic: "Local traffic",
    sharedPool: "Shared pool",
    envoy: "Envoy",
    http1ToHttp2: "HTTP/1 → HTTP/2",
    http1ToHttp1: "HTTP/1 → HTTP/1",
    storage: "Storage",
    cosmosDb: "Azure Cosmos DB",
    connectionCount: {
      one: "{count} open connection",
      other: "{count} open connections",
    },
    podStatus: "{active} active · peak {peak}",
    status: "{busy} busy · {idle} idle · {upstream} concurrent upstream requests",
    podDescription: "Pod {pod}: {active} active requests, peak {peak}.",
    requestDescription: "Request {request} from pod {pod}.",
    connectionDescription: {
      one: "Connection {connection}: {count} active request.",
      other: "Connection {connection}: {count} active requests.",
    },
    clientProcess: "Client process",
    connectionKey:
      "B3 = connection 3 to server process B. Each process has three connections; only available connections are shown.",
    returnedFirst: "Returned first",
    returnedLast: "Returned last",
    nextRequest: "Next request",
    connectionsReturn: "Connections return",
    selectedConnection: "Selected connection",
    serverProcess: "Server process",
    slowerServer: "Slower server",
    overloaded: "Overloaded",
    concurrentRequests: "Concurrent requests",
    request: "Request",
    subsequentRequests: "Subsequent requests",
  },
  initialNarrative: "An initial burst reaches A, B, and the slower process C.",
  returnedNarrative:
    "A and B return connections first. C returns its connections later.",
  lifo: {
    reuseNarrative:
      "LIFO reuses the connection returned most recently, concentrating traffic on slower process C.",
    finalNarrative:
      "C receives a disproportionate share of subsequent requests from every process that connects to it.",
    outcome: "More traffic on the pods already struggling.",
  },
  fifo: {
    reuseNarrative:
      "FIFO selects the oldest returned connection, spreading new work across the pool.",
    finalNarrative:
      "With the same arrivals and server work, FIFO reduces the concentration of requests on C.",
    outcome: "FIFO reuse broke this feedback loop.",
  },
};

/** Reduced motion is the default; explicit playback is a per-figure user choice. */
function motionPreference(initialReduced) {
  let reduced = initialReduced;
  let optedIn = false;
  return {
    get blocked() { return reduced && !optedIn; },
    request() { optedIn = true; },
    configure(nextReduced) {
      if (nextReduced !== reduced) {
        reduced = nextReduced;
        optedIn = false;
      }
    },
  };
}

function initializeSimulation(figure, kind) {
  const e = kind,
    t = copyText,
    r = { current: figure };
  const n = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = motionPreference(n);
  const i = { current: false },
    l = { current: undefined },
    c = { current: false };
  const cleanup = (() => {
    var a;
    let s,
      o,
      d,
      u,
      p,
      h,
      T,
      R,
      L,
      O,
      M,
      F,
      D,
      $,
      _,
      B,
      H,
      z,
      W,
      K,
      V,
      X,
      U,
      Y,
      G,
      J,
      Q,
      Z,
      ee,
      et,
      er,
      en,
      ea = r.current;
    if (!ea) return;
    let es =
        "asyncio" === e
          ? ((s = [1, 6].map((e) =>
              (function (e, t, r) {
                let n,
                  a,
                  s,
                  o = I(r),
                  i =
                    ((n = (e) => Math.round(10 * e) / 10),
                    (a = 0),
                    (s = ["A", "B", "C"].map((e) => {
                      let r = a,
                        s = n(r + t),
                        o = n(s + 0.4);
                      return (
                        (a = o),
                        {
                          id: e,
                          start: r,
                          sendStart: s,
                          sent: o,
                          arrived: n(o + 6),
                          receiveStart: 0,
                          responseStart: 0,
                          end: 0,
                          segments: [],
                        }
                      );
                    })).forEach((e) => {
                      ((e.receiveStart = Math.max(a, e.arrived)),
                        (e.responseStart = n(e.receiveStart + 0.4)),
                        (e.end = n(e.responseStart + t)),
                        (a = e.end),
                        (e.segments = [
                          { kind: "queued", start: 0, end: e.start },
                          { kind: "request", start: e.start, end: e.sendStart },
                          { kind: "send", start: e.sendStart, end: e.sent },
                          { kind: "cosmos", start: e.sent, end: e.arrived },
                          {
                            kind: "ready",
                            start: e.arrived,
                            end: e.receiveStart,
                          },
                          {
                            kind: "receive",
                            start: e.receiveStart,
                            end: e.responseStart,
                          },
                          {
                            kind: "response",
                            start: e.responseStart,
                            end: e.end,
                          },
                        ].filter((e) => e.end - e.start > 1e-8)));
                    }),
                    { cpu: t, requests: s, end: a }),
                  l = f(e, ".asyncio-status"),
                  c = f(e, ".asyncio-timeline-content");
                c.replaceChildren();
                let d = x(c, "div", "asyncio-axis");
                x(d, "span", "", r.scenarios.timeAxis);
                let u = x(d, "div", "asyncio-ticks");
                [0, 10, 20, 30, 40].forEach((e) => x(u, "span", "", String(e)));
                let p = x(c, "div", "asyncio-row asyncio-row--cpu");
                x(p, "strong", "asyncio-row-label", r.scenarios.pythonThread);
                let h = x(p, "div", "asyncio-track"),
                  m = x(h, "div", "asyncio-bars");
                (h.setAttribute("role", "group"),
                  h.setAttribute(
                    "aria-label",
                    r.scenarios.pythonThreadDescription,
                  ));
                let g = [],
                  y = [];
                function b(e, t, n, a = !1) {
                  let s = x(e, "span", "asyncio-segment");
                  ((s.dataset.kind = t.kind),
                    "queued" !== t.kind &&
                      (0 === t.start && (s.dataset.trackStart = "true"),
                      40 === t.end && (s.dataset.trackEnd = "true")),
                    (s.style.left = `${(t.start / 40) * 100}%`),
                    (s.style.width = `${((t.end - t.start) / 40) * 100}%`),
                    v(
                      s,
                      A(r.scenarios.segmentDescription, {
                        request: n,
                        phase: o[t.kind],
                        start: t.start.toFixed(1),
                        end: t.end.toFixed(1),
                      }),
                    ),
                    a && t.end - t.start >= 1
                      ? x(s, "span", "asyncio-segment-label", n)
                      : t.end - t.start >= 4 &&
                        x(
                          s,
                          "span",
                          "asyncio-segment-label",
                          {
                            request: r.phases.cpuRequest,
                            response: r.phases.cpuResponse,
                            cosmos: r.phases.cosmos,
                            ready: r.phases.readyBlocked,
                          }[t.kind] || "",
                        ),
                    g.push({ bar: s, segment: t }));
                }
                (i.requests.forEach((e) => {
                  e.segments
                    .filter((e) =>
                      ["request", "send", "receive", "response"].includes(
                        e.kind,
                      ),
                    )
                    .forEach((t) => b(m, t, e.id, !0));
                }),
                  y.push(x(h, "i", "asyncio-cursor")));
                let w = i.requests.map((e) => {
                    let t = x(c, "div", "asyncio-row"),
                      n = x(t, "div", "asyncio-row-label");
                    x(
                      n,
                      "strong",
                      "",
                      A(r.scenarios.request, { request: e.id }),
                    );
                    let a = x(n, "span", "asyncio-row-state"),
                      s = x(t, "div", "asyncio-track"),
                      o = x(s, "div", "asyncio-bars");
                    e.segments.forEach((t) => b(o, t, e.id));
                    let i = x(s, "i", "asyncio-arrival");
                    return (
                      (i.style.left = `${(e.arrived / 40) * 100}%`),
                      v(
                        i,
                        A(r.scenarios.cosmosSocketDescription, {
                          request: e.id,
                          time: e.arrived.toFixed(1),
                        }),
                      ),
                      y.push(x(s, "i", "asyncio-cursor")),
                      { state: a, row: t, arrival: i }
                    );
                  }),
                  k = f(e, ".asyncio-result");
                return {
                  root: e,
                  trace: i,
                  bars: g,
                  cursors: y,
                  rows: w,
                  status: l,
                  result: k,
                };
              })(f(ea, `[data-asyncio-cpu="${e}"]`), e, t),
            )),
            (o = ea.querySelector("[data-asyncio-time]")),
            (d = ea.querySelector("[data-asyncio-readout]")),
            {
              render: (e) => {
                let r = Math.min(40, g(e, 23e3) / 500);
                (s.forEach((e) => {
                  var n;
                  let a, s, o, i;
                  return (
                    (a = I(t)),
                    (n = e.trace),
                    (o = (s = n.requests.map((e) => ({
                      request: e,
                      phase:
                        e.segments.find((e) => e.start <= r && r < e.end)
                          ?.kind || "done",
                    }))).find(({ phase: e }) =>
                      ["request", "send", "receive", "response"].includes(e),
                    )),
                    (i = {
                      phases: s,
                      owner: o,
                      ready: s.filter(({ phase: e }) => "ready" === e),
                      completed: s.filter(({ phase: e }) => "done" === e)
                        .length,
                    }),
                    void (e.bars.forEach(({ bar: e, segment: t }) => {
                      e.dataset.state =
                        r < t.start ? "future" : r >= t.end ? "past" : "active";
                    }),
                    e.cursors.forEach((e) => {
                      e.style.left = `${(r / 40) * 100}%`;
                    }),
                    i.phases.forEach(({ request: n, phase: a }, s) => {
                      ((e.rows[s].arrival.style.opacity =
                        r >= n.arrived ? "1" : "0.22"),
                        y(
                          e.rows[s].state,
                          {
                            request: t.phases.cpuRequest,
                            send: t.phases.networkWrite,
                            cosmos: t.phases.waitingForCosmos,
                            ready: t.phases.readyBlocked,
                            receive: t.phases.networkRead,
                            response: t.phases.cpuResponse,
                            queued: t.phases.waitingForPython,
                            done: t.phases.complete,
                          }[a] ?? "",
                        ),
                        (e.rows[s].row.dataset.phase = a));
                    }),
                    y(
                      e.status,
                      i.owner
                        ? A(t.scenarios.pythonStatus, {
                            request: i.owner.request.id,
                            phase: a[i.owner.phase],
                          })
                        : 3 === i.completed
                          ? t.scenarios.allRequestsComplete
                          : t.scenarios.pythonIdle,
                    ),
                    y(
                      e.result,
                      i.ready.length
                        ? A(t.scenarios.responseBlocked, {
                            requests: i.ready
                              .map(({ request: e }) => e.id)
                              .join(" + "),
                          })
                        : 3 === i.completed
                          ? A(t.scenarios.finished, {
                              time: e.trace.end.toFixed(1),
                            })
                          : t.scenarios.fixedWait,
                    ))
                  );
                }),
                  o && (o.value = String(r)),
                  d && y(d, A(t.timeControl.readout, { value: r.toFixed(1) })));
              },
              initialTime: 0,
              reducedTime: 8e3,
              seek: (e) => 500 * m(e, 0, 40),
            })
          : "fanin" === e
            ? ((u = C.map((e) =>
                (function (e, t, r) {
                  let n = E(t);
                  e.replaceChildren();
                  let a = x(e, "div", "connection-heading");
                  (x(a, "h4", "", r.scenarios[t].heading),
                    x(
                      e,
                      "p",
                      "connection-description",
                      r.scenarios[t].description,
                    ));
                  let s = x(e, "div", "connection-diagram");
                  function o(e, t, r = "") {
                    let n = x(s, "div", e),
                      a = x(n, "div", "connection-column-label", r),
                      i = x(n, "div", "connection-wire-field"),
                      l = Array.from({ length: t }, (e, r) => {
                        let n = x(i, "div", "connection-wire");
                        return (
                          n.style.setProperty(
                            "--connection-top",
                            `${((r + 0.5) / t) * 100}%`,
                          ),
                          n
                        );
                      });
                    return { field: i, lines: l, label: a };
                  }
                  let i = o("connection-incoming", 6, r.diagram.requests),
                    l = x(s, "div", "connection-processes");
                  x(l, "div", "connection-column-label", r.diagram.pythonPods);
                  let c = x(l, "div", "connection-workers"),
                    d = Array.from({ length: 6 }, (e, t) => {
                      let n = x(c, "div", "connection-worker");
                      x(n, "strong", "", A(r.diagram.pod, { pod: t + 1 }));
                      let a = x(
                        n,
                        "span",
                        "connection-worker-count",
                        r.diagram.initialPodStatus,
                      );
                      return { worker: n, count: a };
                    }),
                    u =
                      "direct" === t
                        ? null
                        : o("connection-inbound", 6, r.diagram.localTraffic);
                  if (u) {
                    let e = x(s, "div", "connection-proxy-column");
                    x(
                      e,
                      "div",
                      "connection-column-label",
                      r.diagram.sharedPool,
                    );
                    let n = x(e, "div", "connection-proxy");
                    (x(n, "strong", "", r.diagram.envoy),
                      x(
                        n,
                        "span",
                        "",
                        "http2" === t
                          ? r.diagram.http1ToHttp2
                          : r.diagram.http1ToHttp1,
                      ));
                  }
                  let p = o("connection-outbound", 0),
                    h = x(s, "div", "connection-cosmos-column");
                  x(h, "div", "connection-column-label", r.diagram.storage);
                  let m = x(h, "div", "connection-cosmos");
                  x(m, "strong", "", r.diagram.cosmosDb);
                  let g = x(e, "p", "connection-status");
                  return {
                    trace: n,
                    root: e,
                    incoming: i,
                    inbound: u,
                    outbound: p,
                    workerViews: d,
                    connectionCount: p.label,
                    packets: new Map(),
                    status: g,
                  };
                })(f(ea, `[data-stage="connection-${e}"]`), e, t),
              )),
              {
                render: (e) =>
                  u.forEach((r) =>
                    (function (e, t, r) {
                      let n = (function (e, t) {
                        (t < e.lastElapsed && Object.assign(e, E(e.mode)),
                          (e.lastElapsed = t),
                          (function (e, t) {
                            for (; e.nextArrival <= t; ) {
                              let t = e.nextArrival,
                                r = S[Math.floor((e.nextId - 1) / 3) % 6];
                              e.nextArrival += 1e3;
                              let n = t + 1400,
                                a = n + 1400 * ("direct" !== e.mode),
                                s = a + 3e3,
                                o = s + 3e3,
                                i = o + 1400 * ("direct" !== e.mode),
                                l = "http2" === e.mode ? 6 : 1,
                                c = e.connections.find(
                                  (t) =>
                                    ("direct" !== e.mode || t.owner === r) &&
                                    t.slots.some((e) => e <= a),
                                );
                              c ||
                                ((c = {
                                  id: e.connections.length,
                                  born: a,
                                  owner: "direct" === e.mode ? r : null,
                                  ownerIndex: e.connections.filter(
                                    (e) => e.owner === r,
                                  ).length,
                                  slots: Array(l).fill(a),
                                }),
                                e.connections.push(c));
                              let d = c.slots.findIndex((e) => e <= a);
                              ((c.slots[d] = o),
                                (e.activeRequests = e.activeRequests.filter(
                                  (e) => e.released > a,
                                )));
                              let u =
                                e.activeRequests.filter((e) => e.process === r)
                                  .length + 1;
                              e.podPeaks[r] = Math.max(e.podPeaks[r], u);
                              let p = {
                                id: e.nextId++,
                                process: r,
                                arrival: t,
                                processAt: n,
                                ready: a,
                                start: a,
                                cosmosAt: s,
                                responseAt: s,
                                released: o,
                                end: i,
                                connection: c.id,
                                slot: d,
                                peaks: [...e.podPeaks],
                              };
                              (e.requests.push(p), e.activeRequests.push(p));
                            }
                          })(e, t),
                          e.requests.length > 128 &&
                            (e.requests = e.requests.slice(-64)));
                        let r = [],
                          n = Array(6).fill(0);
                        for (let a of e.requests) {
                          if ((a.start <= t && (n = a.peaks), t >= a.end))
                            continue;
                          let e,
                            s = 0,
                            o;
                          (t < a.processAt
                            ? ((e = "arrival"),
                              (o = "incoming"),
                              (s = (t - a.arrival) / 1400))
                            : t < a.start
                              ? ((e = "request"),
                                (o = "inbound"),
                                (s = (t - a.processAt) / 1400))
                              : t < a.cosmosAt
                                ? ((e = "request"),
                                  (o = "outbound"),
                                  (s = (t - a.start) / 3e3))
                                : t < a.released
                                  ? ((e = "response"),
                                    (o = "outbound"),
                                    (s = 1 - (t - a.responseAt) / 3e3))
                                  : ((e = "response"),
                                    (o = "inbound"),
                                    (s = 1 - (t - a.released) / 1400)),
                            r.push({ ...a, phase: e, field: o, progress: s }));
                        }
                        let a = e.connections
                            .filter((e) => e.born <= t)
                            .map((e) => ({
                              id: e.id,
                              owner: e.owner,
                              ownerIndex: e.ownerIndex,
                              born: e.born,
                              requests: r.filter(
                                (r) =>
                                  r.connection === e.id &&
                                  r.start <= t &&
                                  t < r.released,
                              ),
                            })),
                          s = a.flatMap((e) => e.requests);
                        return {
                          requests: r,
                          connections: a,
                          peaks: [...n],
                          upstream: s.length,
                          active: a.filter((e) => e.requests.length).length,
                          workers: Array.from({ length: 6 }, (e, t) =>
                            s.filter((e) => e.process === t),
                          ),
                        };
                      })(e.trace, t);
                      for (; e.outbound.lines.length > n.connections.length; )
                        e.outbound.lines.pop()?.remove();
                      for (; e.outbound.lines.length < n.connections.length; )
                        e.outbound.lines.push(
                          x(e.outbound.field, "div", "connection-wire"),
                        );
                      (n.connections.forEach((t, n) => {
                        let a = e.outbound.lines[n];
                        ((a.dataset.active = String(t.requests.length > 0)),
                          a.style.setProperty(
                            "--connection-top",
                            `${N(e.trace, t.id)}%`,
                          ),
                          v(
                            a,
                            P(
                              r.diagram.connectionDescription,
                              t.requests.length,
                              { connection: n + 1 },
                            ),
                          ));
                      }),
                        e.workerViews.forEach(({ worker: t, count: a }, s) => {
                          let o = n.workers[s];
                          ((t.dataset.active = String(o.length > 0)),
                            y(
                              a,
                              A(r.diagram.podStatus, {
                                active: o.length,
                                peak: n.peaks[s],
                              }),
                            ),
                            v(
                              t,
                              A(r.diagram.podDescription, {
                                pod: s + 1,
                                active: o.length,
                                peak: n.peaks[s],
                              }),
                            ),
                            (e.incoming.lines[s].dataset.active = String(
                              n.requests.some(
                                (e) => e.process === s && "arrival" === e.phase,
                              ),
                            )),
                            e.inbound &&
                              (e.inbound.lines[s].dataset.active = String(
                                o.length > 0,
                              )));
                        }));
                      let a = new Set(n.requests.map((e) => e.id));
                      (e.packets.forEach((t, r) => {
                        a.has(r) || (t.remove(), e.packets.delete(r));
                      }),
                        n.requests.forEach((n) => {
                          let a = e[n.field]?.field;
                          if (!a) return;
                          let s = e.packets.get(n.id);
                          (s ||
                            (((s = x(
                              a,
                              "span",
                              "connection-packet",
                            )).dataset.requestId = String(n.id)),
                            v(
                              s,
                              A(r.diagram.requestDescription, {
                                request: n.id,
                                pod: n.process + 1,
                              }),
                            ),
                            e.packets.set(n.id, s)),
                            s.parentElement !== a && a.appendChild(s));
                          let o = "response" === n.phase,
                            i = n.start,
                            l = n.cosmosAt;
                          "incoming" === n.field
                            ? ((i = n.arrival), (l = n.processAt))
                            : "inbound" === n.field
                              ? ((i = o ? n.released : n.processAt),
                                (l = o ? n.end : n.start))
                              : o && ((i = n.responseAt), (l = n.released));
                          let c =
                              i +
                              240 *
                                ("request" === n.phase && i === n.processAt),
                            d = m((t - c) / (l - c), 0, 1),
                            u = m(Math.min(t - c, l - t) / 160, 0, 1);
                          (s.hidden !== (0 === u) && (s.hidden = 0 === u),
                            (s.style.opacity = String(u)),
                            (s.dataset.kind = o ? "response" : "request"),
                            (s.style.left = `${(o ? 1 - d : d) * 100}%`),
                            s.style.setProperty(
                              "--connection-top",
                              `${"outbound" === n.field ? N(e.trace, n.connection) : ((n.process + 0.5) / 6) * 100}%`,
                            ));
                        }),
                        y(
                          e.connectionCount,
                          P(r.diagram.connectionCount, n.connections.length),
                        ),
                        y(
                          e.status,
                          A(r.diagram.status, {
                            busy: n.active,
                            idle: n.connections.length - n.active,
                            upstream: n.upstream,
                          }),
                        ));
                    })(r, e, t),
                  ),
                initialTime: 4e4,
                reducedTime: 4e4,
                replayTime: 0,
              })
            : ((a = f(ea, `[data-stage="${e}"]`)),
              a.replaceChildren(),
              (p = (function (e, t = k) {
                if ("lifo" !== e && "fifo" !== e)
                  throw Error("Unknown connection reuse policy.");
                let r = [...w],
                  n = Object.freeze([...r]),
                  a = [],
                  s = [],
                  o = { A: 0, B: 0, C: 0 },
                  i = [];
                function l(e) {
                  (i
                    .filter((t) => t.end <= e)
                    .sort((e, t) => e.end - t.end || e.id - t.id)
                    .forEach((e) => {
                      (r.push(e.connection),
                        a.push(
                          Object.freeze({
                            type: "return",
                            time: e.end,
                            connection: e.connection,
                            requestId: e.id,
                            server: e.server,
                            idle: Object.freeze([...r]),
                          }),
                        ));
                    }),
                    (i = i.filter((t) => t.end > e)));
                }
                function c(t, n) {
                  l(t);
                  let c = "lifo" === e ? r.pop() : r.shift();
                  if (!c) throw Error("No returned connection is available.");
                  let d = c[0],
                    u = t + 150,
                    p = Math.max(u, o[d]),
                    h = p + ("C" === d ? 1200 : 100);
                  o[d] = h;
                  let m = Object.freeze({
                    id: s.length,
                    connection: c,
                    server: d,
                    initial: n,
                    start: t,
                    requestEnd: u,
                    workStart: p,
                    responseStart: h,
                    end: h + 150,
                  });
                  (s.push(m),
                    i.push(m),
                    a.push(
                      Object.freeze({
                        type: "request",
                        time: t,
                        connection: c,
                        server: d,
                        requestId: m.id,
                        idle: Object.freeze([...r]),
                      }),
                    ));
                }
                return (
                  w.forEach(() => c(0, !0)),
                  t.forEach((e) => c(e, !1)),
                  l(1 / 0),
                  Object.freeze({
                    mode: e,
                    initialIdle: n,
                    events: Object.freeze(a),
                    requests: Object.freeze(s),
                  })
                );
              })(e)),
              (h = x(a, "div", "pool-system")).setAttribute(
                "aria-hidden",
                "true",
              ),
              (h.dataset.policy = e),
              (T = x(h, "div", "pool-client")),
              (R = x(T, "div", "pool-client-heading")),
              x(R, "strong", "", t.diagram.clientProcess),
              x(T, "p", "pool-connection-key", t.diagram.connectionKey),
              (L = x(T, "div", "pool-return-order")),
              x(L, "span", "", t.diagram.returnedFirst),
              x(L, "span", "", t.diagram.returnedLast),
              (O = x(T, "div", "pool-returned-well")),
              (M = x(O, "div", "pool-empty-slots")),
              w.forEach(() => x(M, "i", "")),
              (F = x(O, "div", "pool-connection-track")),
              (D = new Map(
                w.map((e) => {
                  let t = x(F, "span", "pool-connection", e);
                  return (
                    (t.dataset.connection = e),
                    (t.dataset.server = e[0]),
                    [e, t]
                  );
                }),
              )),
              ($ = x(T, "div", "pool-selection")),
              (_ = x($, "i", "pool-selection-arrow", "↑")),
              (B = x($, "span", "pool-selection-label", t.diagram.nextRequest)),
              (H = x($, "strong", "pool-next-choice", "—")),
              (z = x(h, "div", "pool-traffic")),
              (W = b.map((e) => {
                let t = x(z, "div", "pool-branch");
                return (
                  (t.dataset.server = e),
                  x(t, "i", "pool-request-wire"),
                  x(t, "i", "pool-response-wire"),
                  t
                );
              })),
              (K = new Map(
                p.requests.map((e) => {
                  let t = x(z, "i", "pool-traffic-packet");
                  return (
                    (t.dataset.requestId = String(e.id)),
                    (t.dataset.server = e.server),
                    t.style.setProperty(
                      "--ha-pool-server",
                      String(b.indexOf(e.server)),
                    ),
                    [e.id, t]
                  );
                }),
              )),
              (V = x(h, "div", "pool-processes")),
              (X = b.map((e) => {
                let r = x(V, "div", "pool-process");
                r.dataset.server = e;
                let n = x(r, "div", "pool-process-heading");
                (x(n, "span", "", t.diagram.serverProcess),
                  x(n, "strong", "", e));
                let a = x(
                    r,
                    "p",
                    "pool-process-note",
                    "C" === e ? t.diagram.slowerServer : "",
                  ),
                  s = x(r, "strong", "pool-process-count", "0");
                x(r, "span", "pool-count-label", t.diagram.concurrentRequests);
                let o = x(r, "div", "pool-process-load");
                for (let e = 0; e < 3; e += 1) x(o, "i", "pool-load-slot");
                let i = new Map(
                  p.requests
                    .filter((t) => t.server === e)
                    .map((e) => {
                      let r = x(
                        o,
                        "span",
                        "pool-load-request",
                        t.diagram.request,
                      );
                      r.dataset.requestId = String(e.id);
                      let n = x(r, "i", "pool-request-work");
                      return [e.id, { tile: r, work: n }];
                    }),
                );
                return { node: r, note: a, count: s, load: o, tiles: i };
              })),
              (U = x(h, "div", "pool-request-history")),
              x(U, "span", "pool-history-label", t.diagram.subsequentRequests),
              (Y = x(U, "div", "pool-history-track")),
              (G = p.requests
                .filter((e) => !e.initial)
                .map(() => x(Y, "span", "pool-history-request", ""))),
              x(h, "p", "pool-outcome", t[e].outcome),
              (J = {
                root: h,
                trace: p,
                chips: D,
                selectionLabel: B,
                selectionArrow: _,
                nextChoice: H,
                routes: W,
                packetNodes: K,
                processes: X,
                historyItems: G,
              }),
              (Q = ea.querySelector('[data-progress="pool"]')),
              (Z = ea.querySelector("[data-pool-narrative]")),
              (ee = Array.from(ea.querySelectorAll("button[data-phase]"))),
              (et = [
                t.initialNarrative,
                t.returnedNarrative,
                t[e].reuseNarrative,
                t[e].finalNarrative,
              ]),
              (er = Z?.parentElement) &&
                (er
                  .querySelectorAll(".pool-narrative-space")
                  .forEach((e) => e.remove()),
                et.forEach((e) => {
                  x(er, "p", "pool-narrative-space", e).setAttribute(
                    "aria-hidden",
                    "true",
                  );
                })),
              (en = -1),
              {
                render: (e) => {
                  var r;
                  let n,
                    a,
                    s,
                    o,
                    i,
                    l,
                    { phase: c } =
                      ((n = q(e)),
                      (s = (a = (function (e, t) {
                        let r = e.initialIdle,
                          n = null,
                          a = null;
                        for (let s of e.events)
                          s.time > t ||
                            ((r = s.idle),
                            "return" === s.type ? (n = s) : (a = s));
                        let s = e.requests.filter(
                            (e) => e.start <= t && t < e.end,
                          ),
                          o = b.map((e) => {
                            let r = s.filter(
                              (r) =>
                                r.server === e &&
                                r.requestEnd <= t &&
                                t < r.responseStart,
                            );
                            return { server: e, pending: r, count: r.length };
                          });
                        return {
                          time: t,
                          idle: r,
                          active: s,
                          servers: o,
                          lastReturn: n,
                          lastDispatch: a,
                          next: "lifo" === e.mode ? r[r.length - 1] : r[0],
                        };
                      })((r = J.trace), n)).active.map((e) => {
                        let t =
                            n < e.requestEnd
                              ? "request"
                              : n >= e.responseStart
                                ? "response"
                                : "processing",
                          r =
                            "request" === t
                              ? (n - e.start) / (e.requestEnd - e.start)
                              : "response" === t
                                ? 1 -
                                  (n - e.responseStart) /
                                    (e.end - e.responseStart)
                                : null;
                        return { request: e, phase: t, progress: r };
                      })),
                      (o = {
                        ...a,
                        packets: s,
                        previewNext: n >= 1500 && n < 1600,
                        phase: n < 1050 ? 0 : n < k[0] ? 1 : n < 11850 ? 2 : 3,
                        history: r.requests.filter(
                          (e) => !e.initial && e.start <= n,
                        ),
                        recentReturn:
                          a.lastReturn && n - a.lastReturn.time < 300
                            ? a.lastReturn
                            : null,
                      }),
                      (J.root.dataset.phase = String(o.phase)),
                      (J.root.dataset.choice = o.next || ""),
                      (J.root.dataset.time = String(n)),
                      J.chips.forEach((e, t) => {
                        let r = o.idle.indexOf(t);
                        ((e.dataset.busy = String(r < 0)),
                          (e.hidden = r < 0),
                          (e.dataset.next = String(
                            o.previewNext && t === o.next,
                          )),
                          (e.dataset.returned = String(
                            t === o.recentReturn?.connection,
                          )),
                          r >= 0 &&
                            e.style.setProperty("--ha-pool-slot", String(r)));
                      }),
                      (i = o.previewNext
                        ? o.next
                        : o.phase < 2
                          ? o.lastReturn?.connection
                          : o.lastDispatch?.connection),
                      y(
                        J.selectionLabel,
                        o.previewNext
                          ? t.diagram.nextRequest
                          : o.phase < 2
                            ? t.diagram.connectionsReturn
                            : t.diagram.selectedConnection,
                      ),
                      y(J.nextChoice, i || "—"),
                      (J.nextChoice.dataset.server = i?.[0] || ""),
                      (J.selectionArrow.hidden = !o.previewNext || !o.next),
                      J.selectionArrow.style.setProperty(
                        "--ha-pool-slot",
                        String(Math.max(0, o.idle.indexOf(o.next ?? ""))),
                      ),
                      J.packetNodes.forEach((e) => {
                        e.hidden = !0;
                      }),
                      (l = {
                        A: { request: !1, response: !1 },
                        B: { request: !1, response: !1 },
                        C: { request: !1, response: !1 },
                      }),
                      o.packets.forEach(
                        ({ request: e, phase: t, progress: r }) => {
                          let n = J.packetNodes.get(e.id);
                          n &&
                            null !== r &&
                            ((n.hidden = !1),
                            (n.dataset.kind = t),
                            n.style.setProperty("--ha-pool-travel", String(r)),
                            "processing" !== t && (l[e.server][t] = !0));
                        },
                      ),
                      J.routes.forEach((e, t) => {
                        let r = l[b[t]];
                        ((e.dataset.request = String(r.request)),
                          (e.dataset.response = String(r.response)));
                      }),
                      J.processes.forEach((e, r) => {
                        let a = o.servers[r];
                        (y(e.count, String(a.count)),
                          (e.node.dataset.count = String(a.count)));
                        let s =
                          "C" === a.server &&
                          a.pending.some((e) => e.workStart > n);
                        ((e.node.dataset.overloaded = String(s)),
                          y(
                            e.note,
                            "C" === a.server
                              ? s
                                ? t.diagram.overloaded
                                : t.diagram.slowerServer
                              : "",
                          ),
                          e.tiles.forEach(({ tile: e, work: t }, r) => {
                            let s = a.pending.findIndex((e) => e.id === r);
                            if (((e.hidden = s < 0), s < 0)) return;
                            let o = a.pending[s];
                            (e.style.setProperty(
                              "--ha-pool-load-slot",
                              String(s),
                            ),
                              (e.dataset.processing = String(n >= o.workStart)),
                              t.style.setProperty(
                                "--ha-pool-work",
                                String(
                                  m(
                                    (n - o.workStart) /
                                      (o.responseStart - o.workStart),
                                    0,
                                    1,
                                  ),
                                ),
                              ));
                          }));
                      }),
                      J.historyItems.forEach((e, t) => {
                        let r = o.history[t];
                        (y(e, r?.server || ""),
                          (e.dataset.server = r?.server || ""),
                          (e.dataset.sent = String(!!r)),
                          (e.dataset.active = String(!!r && n < r.end)));
                      }),
                      o),
                    d = j.findIndex((e) => e.phase === (c < 2 ? 0 : c)),
                    u = 6 * j[d].start,
                    p = j[d + 1],
                    h = p ? 6 * p.start : 72700,
                    f =
                      3 === c
                        ? 1
                        : (d + (g(e, 72700) - u) / (h - u)) / j.length;
                  (Q && (Q.style.transform = `scaleX(${f.toFixed(4)})`),
                    c !== en &&
                      ((en = c),
                      Z && y(Z, et[c]),
                      ee.forEach((e) => {
                        let t = Number(e.dataset.phase) === (c < 2 ? 0 : c);
                        e.setAttribute("aria-pressed", String(t));
                      })));
                },
                initialTime: 0,
                reducedTime: 71100,
                isComplete: (e) => q(e) >= 11850,
                seek: (e) => (j.find((t) => t.phase === e)?.inspect ?? 0) * 6,
              }),
      eo = new AbortController(),
      ei = f(ea, '[data-action="toggle-motion"]'),
      el = n ? es.reducedTime : es.initialTime,
      ec = true,
      ed = 0,
      eu = null,
      ep = (e) => {
        ((ed = 0),
          null !== eu && (el += e - eu),
          (eu = e),
          es.render(el));
        if (es.isComplete?.(el)) {
          ec = true;
          eh();
          return;
        }
        ed = requestAnimationFrame(ep);
      },
      eh = () => {
        if (motion.blocked) ec = true;
        (cancelAnimationFrame(ed), (ed = 0), (eu = null));
        let e = ec && !!es.isComplete?.(el) && !motion.blocked;
        ((ea.dataset.state = !ec && i.current ? "playing" : "paused"),
          (ea.dataset.complete = String(e)),
          (ei.disabled = e),
          ei.setAttribute(
            "aria-label",
            e
              ? t.playback.complete
              : ec
                ? t.playback.playAnimation
                : t.playback.pauseAnimation,
          ),
          y(
            f(ei, ".control-label"),
            e ? t.playback.complete : ec ? t.playback.play : t.playback.pause,
          ),
          es.render(el),
          ec || c.current || !i.current || (ed = requestAnimationFrame(ep)));
      };
    ((l.current = eh),
      ei.addEventListener(
        "click",
        () => {
          if (ec && es.isComplete?.(el)) el = es.replayTime ?? es.initialTime;
          motion.request();
          ((ec = !ec), eh());
        },
        { signal: eo.signal },
      ),
      f(ea, '[data-action="replay"]').addEventListener(
        "click",
        () => {
          motion.request();
          ((el = es.replayTime ?? es.initialTime),
            (ec = false),
            eh());
        },
        { signal: eo.signal },
      ),
      ea.querySelectorAll("button[data-phase]").forEach((e) => {
        e.addEventListener(
          "click",
          () => {
            ((el = es.seek?.(Number(e.dataset.phase)) ?? el), (ec = !0), eh());
          },
          { signal: eo.signal },
        );
      }));
    let em = ea.querySelector("[data-asyncio-time]");
    return (
      em?.addEventListener(
        "input",
        () => {
          ((el = es.seek?.(Number(em.value)) ?? el), (ec = !0), eh());
        },
        { signal: eo.signal },
      ),
      eh(),
      () => {
        (eo.abort(),
          cancelAnimationFrame(ed),
          (l.current = null),
          (c.current = !1),
          ea
            .querySelectorAll("[data-stage]")
            .forEach((e) => e.replaceChildren()),
          ea
            .querySelectorAll(".pool-narrative-space")
            .forEach((e) => e.remove()));
      }
    );
  })();
  return {
    cleanup,
    configure(config) {
      motion.configure(config.reducedMotion);
      i.current = config.active;
      l.current?.();
    },
  };
}

function initializeFlow(figure) {
  const svgs = [...figure.querySelectorAll("svg")].filter((svg) =>
    svg.querySelector("animateMotion"),
  );
  const toggle = figure.querySelector('[data-action="toggle-motion"]');
  const replay = figure.querySelector('[data-action="replay"]');
  let requested = false, active = false;
  const motion = motionPreference(matchMedia("(prefers-reduced-motion: reduce)").matches);
  const refresh = () => {
    if (motion.blocked) requested = false;
    const playing = requested && active && !motion.blocked;
    svgs.forEach((svg) =>
      playing ? svg.unpauseAnimations() : svg.pauseAnimations(),
    );
    toggle.textContent = requested ? "Pause" : "Play";
    toggle.setAttribute(
      "aria-label",
      requested ? "Pause animation" : "Play animation",
    );
    toggle.setAttribute("aria-pressed", String(requested));
    toggle.disabled = false;
    figure.dataset.state = playing ? "playing" : "paused";
  };
  toggle.addEventListener("click", () => {
    motion.request();
    requested = !requested;
    refresh();
  });
  replay.addEventListener("click", () => {
    svgs.forEach((svg) => svg.setCurrentTime(0));
    motion.request();
    requested = true;
    refresh();
  });
  refresh();
  return {
    cleanup: () => svgs.forEach((svg) => svg.pauseAnimations()),
    configure(config) {
      active = config.active;
      motion.configure(config.reducedMotion);
      refresh();
    },
  };
}

/** Preserve original coordinates while fitting the fixed-width overview canvas. */
function initializeFit(figure) {
  const board = figure.querySelector('[class*="__board"]');
  const viewport = board.closest(".scrollable");
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = "zoom-diagram";
  let zoomed = false;
  const fit = () => {
    const scale = Math.min(1, viewport.clientWidth / board.offsetWidth);
    board.style.zoom = zoomed ? "1" : String(scale);
    button.textContent = zoomed ? "Fit diagram" : "Zoom in";
    button.setAttribute("aria-pressed", String(zoomed));
    button.setAttribute("aria-label", zoomed ? "Fit entire diagram" : "Show diagram at original size");
    button.disabled = scale >= 1;
    if (!zoomed) viewport.scrollLeft = 0;
  };
  button.addEventListener("click", () => { zoomed = !zoomed; fit(); });
  figure.querySelector(".flow-controls").appendChild(button);
  const observer = new ResizeObserver(fit);
  observer.observe(viewport);
  fit();
  return () => { observer.disconnect(); button.remove(); };
}
const kind = document.body.dataset.figureKind;
const figure = document.querySelector("figure");
let controller;
try {
  controller = ["platform", "request-flow"].includes(kind)
    ? initializeFlow(figure)
    : initializeSimulation(figure, kind);
} catch (error) {
  document.body.dataset.figureError =
    error instanceof Error ? error.message : "Figure initialization failed";
  console.error("Habitat figure initialization failed", error);
}
if (controller) {
  const fitCleanup = kind === "platform" ? initializeFit(figure) : () => {};
  let requestedSize = 0,
    lastHeight = 0;
  const notify = () => {
    requestedSize = 0;
    const height = Math.ceil(
      document.querySelector("main").getBoundingClientRect().height,
    );
    if (height !== lastHeight) {
      lastHeight = height;
      parent.postMessage({ type: "neural-atlas:figure-ready", height }, "*");
    }
  };
  const schedule = () => {
    if (!requestedSize) requestedSize = requestAnimationFrame(notify);
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(document.querySelector("main"));
  const configure = (config) => {
    document.documentElement.dataset.theme =
      config.theme === "dark" ? "dark" : "light";
    controller.configure({
      active: config.active === true && !document.hidden,
      reducedMotion: config.reducedMotion === true,
    });
    schedule();
  };
  window.addEventListener("message", (event) => {
    if (
      event.source !== parent ||
      !event.data ||
      event.data.type !== "neural-atlas:figure-config"
    )
      return;
    configure(event.data);
  });
  const standalone = parent === window;
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const initial = {
    active: standalone,
    reducedMotion: media.matches,
    theme: matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  };
  configure(initial);
  if (standalone) {
    document.addEventListener("visibilitychange", () => configure(initial));
    media.addEventListener("change", () => {
      initial.reducedMotion = media.matches;
      configure(initial);
    });
  }
  window.addEventListener(
    "pagehide",
    () => {
      resize.disconnect();
      fitCleanup();
      cancelAnimationFrame(requestedSize);
      controller.cleanup?.();
    },
    { once: true },
  );
  notify();
}
