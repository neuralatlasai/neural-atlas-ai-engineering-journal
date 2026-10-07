/** Homepage art direction is curated separately from each article's full schematic. */
export type CoverSymbol =
  | "plane" | "gear" | "chip" | "shuffle" | "code" | "terminal"
  | "server" | "route" | "database" | "tokens" | "filter" | "cube"
  | "search" | "flask" | "chart" | "check" | "document" | "gradient"
  | "bolt" | "wave" | "shield" | "deploy" | "refresh" | "chat"
  | "lock" | "tree" | "graph" | "layers" | "weights" | "globe";

export interface CoverNode {
  readonly symbol: CoverSymbol;
  readonly x: number;
  readonly y: number;
  readonly shape?: "tile" | "circle" | "window" | "diamond" | "bare";
  readonly width?: number;
  readonly height?: number;
}

export interface CoverConnection {
  readonly path: string;
  readonly dashed?: boolean;
  readonly arrow?: boolean;
}

export interface HomeCover {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly palette: "sky" | "mint" | "lilac" | "sand" | "rose" | "ice" | "sage";
  readonly nodes: readonly CoverNode[];
  readonly connections: readonly CoverConnection[];
}

const node = (symbol: CoverSymbol, x: number, y: number,
  shape: CoverNode["shape"] = "tile", width = 96, height = width): CoverNode =>
  ({ symbol, x, y, shape, width, height });
const link = (path: string, dashed = false, arrow = true): CoverConnection =>
  ({ path, dashed, arrow });

/** Domains have independent compositions; none borrows an article's cover. */
export const homeDomainCovers: Readonly<Record<string, HomeCover>> = {
  blogs: {
    id: "domain-system-notes", palette: "sky", title: "Trace a system from input to execution",
    description: "An input travels through processing and compute. A return path closes the feedback loop, the subject of technical field notes.",
    nodes: [node("plane", 150, 194), node("gear", 360, 194), node("chip", 570, 194)],
    connections: [link("M198 194H302"), link("M408 194H512"),
      link("M570 242V298Q570 312 556 312H164Q150 312 150 298V252")],
  },
  components: {
    id: "domain-composable-modules", palette: "mint", title: "Compose modules into a working interface",
    description: "A transformation module and a compute module connect through explicit ports to an application window with a visible validation boundary.",
    nodes: [node("shuffle", 246, 136, "tile", 104), node("chip", 474, 136, "tile", 104),
      node("shield", 360, 300, "window", 232, 106)],
    connections: [link("M246 188V210Q246 224 260 224H345Q360 224 360 239"),
      link("M474 188V210Q474 224 460 224H375Q360 224 360 239")],
  },
  engineering: {
    id: "domain-service-routing", palette: "lilac", title: "Route work across a service boundary",
    description: "A client terminal sends work to a router. Separate paths reach a server group and a storage resource, making the serving boundary visible.",
    nodes: [node("terminal", 132, 225), node("route", 330, 225, "circle", 94),
      node("server", 553, 130, "tile", 108), node("database", 553, 320, "tile", 108)],
    connections: [link("M180 225H273"),
      link("M377 225H413Q430 225 430 208V147Q430 130 447 130H489"),
      link("M377 225H413Q430 225 430 242V303Q430 320 447 320H489")],
  },
  models: {
    id: "domain-routed-experts", palette: "sand", title: "Select the computation a token needs",
    description: "Token states enter a routing decision. Solid paths select two compute experts; a dotted path represents another available expert.",
    nodes: [node("tokens", 121, 225, "bare"), node("route", 298, 225, "diamond", 94),
      node("chip", 542, 106, "tile", 82), node("chip", 542, 225, "tile", 82), node("chip", 542, 344, "tile", 82)],
    connections: [link("M174 225H239"), link("M348 225H405Q421 225 421 209V122Q421 106 437 106H491"),
      link("M350 225H491"), link("M348 225H405Q421 225 421 241V328Q421 344 437 344H491", true)],
  },
  research: {
    id: "domain-experimental-method", palette: "rose", title: "Turn a question into evidence",
    description: "A research question leads to an experiment and an observed result. Verification returns the result to the original question for the next iteration.",
    nodes: [node("search", 196, 132, "circle", 88), node("flask", 508, 132, "circle", 88),
      node("chart", 508, 312, "window", 126, 90), node("check", 196, 312, "circle", 88)],
    connections: [link("M240 132H454"), link("M508 176V257"), link("M445 312H250"), link("M196 268V186", true)],
  },
  training: {
    id: "domain-learning-update", palette: "ice", title: "Close the learning loop",
    description: "Training examples enter a model. A loss signal becomes a gradient, and an optimizer sends an updated state back to the model.",
    nodes: [node("document", 116, 178, "bare"), node("chip", 314, 178),
      node("chart", 555, 178, "window", 112, 92), node("gradient", 555, 326, "circle", 76), node("gear", 314, 326, "circle", 76)],
    connections: [link("M162 178H256"), link("M362 178H489"), link("M555 224V278"), link("M517 326H362"), link("M314 288V236")],
  },
};

/** Explicit source identities prevent a shared domain image from impersonating an article. */
export const homeArticleCovers: ReadonlyMap<string, HomeCover> = new Map<string, HomeCover>([
  ["cyber-defense", {
    id: "article-adaptive-defense", palette: "lilac", title: "An adaptive defense loop",
    description: "An attack produces telemetry. Detection, verification, and deployment feed a fresh attack, with an agent coordinating the six-stage cycle.",
    nodes: [node("bolt", 164, 134, "circle", 76), node("wave", 360, 96, "circle", 76),
      node("shield", 556, 134, "circle", 76), node("check", 556, 316, "circle", 76),
      node("deploy", 360, 354, "circle", 76), node("refresh", 164, 316, "circle", 76), node("code", 360, 225)],
    connections: [link("M202 126L312 105"), link("M398 104L508 125"), link("M556 172V268"),
      link("M518 324L408 345"), link("M322 346L212 325"), link("M164 278V182"),
      link("M326 191L207 161", true, false), link("M394 259L513 289", true, false)],
  }],
  ["ai-boundaries", {
    id: "article-four-system-boundaries", palette: "sage", title: "Four properties require four controls",
    description: "Four independent pairs show prediction with verification, knowledge with retrieval, working memory with selection, and instruction following with permissions. These controls are complementary, not a processing sequence.",
    nodes: [node("chat", 178, 132, "tile", 88), node("check", 300, 132, "circle", 56),
      node("database", 480, 132, "tile", 88), node("search", 602, 132, "circle", 56),
      node("layers", 178, 312, "tile", 88), node("filter", 300, 312, "circle", 56),
      node("plane", 480, 312, "tile", 88), node("lock", 602, 312, "circle", 56)],
    connections: [link("M222 132H262"), link("M524 132H564"), link("M222 312H262"), link("M524 312H564")],
  }],
  ["grpo", {
    id: "article-group-relative-rewards", palette: "mint", title: "Compare a response group before a policy update",
    description: "One prompt fans out to candidate responses. Their scores are compared as a group, and a relative reward signal reaches the policy update. The three branches are illustrative.",
    nodes: [node("chat", 96, 225, "circle", 76), node("document", 265, 105, "tile", 72),
      node("document", 265, 225, "tile", 72), node("document", 265, 345, "tile", 72),
      node("weights", 452, 225), node("chip", 624, 225, "circle", 84)],
    connections: [link("M134 225H165Q181 225 181 209V121Q181 105 197 105H219"), link("M134 225H219"),
      link("M134 225H165Q181 225 181 241V329Q181 345 197 345H219"),
      link("M301 105H335Q351 105 351 121V209Q351 225 367 225H394"), link("M301 225H394"),
      link("M301 345H335Q351 345 351 329V241Q351 225 367 225H394"), link("M500 225H572")],
  }],
  ["versioned-corpus", {
    id: "article-versioned-evidence", palette: "sand", title: "Preserve evidence through structural transformation",
    description: "Locked source evidence becomes a structural tree and a versioned knowledge graph. Independent document projections remain connected to the same evidence lineage.",
    nodes: [node("lock", 112, 225, "tile", 86), node("tree", 294, 225, "tile", 94), node("graph", 478, 225, "circle", 98),
      node("document", 624, 128, "bare", 62), node("layers", 624, 225, "bare", 62), node("chart", 624, 322, "bare", 62)],
    connections: [link("M155 225H237"), link("M341 225H419"),
      link("M527 225H550Q566 225 566 209V144Q566 128 582 128H584"), link("M527 225H584"),
      link("M527 225H550Q566 225 566 241V306Q566 322 582 322H584")],
  }],
  ["deepseek-architecture", {
    id: "article-hybrid-compute", palette: "sky", title: "Separate attention, expert computation, and residual paths",
    description: "A model core connects token states to hybrid attention and sparse expert computation. A separate layered branch represents the residual topology.",
    nodes: [node("chip", 360, 225, "tile", 124), node("tokens", 154, 112, "circle", 82),
      node("filter", 566, 112, "circle", 82), node("layers", 154, 338, "tile", 82), node("cube", 566, 338, "tile", 82)],
    connections: [link("M192 134L290 188"), link("M422 189L519 135"), link("M299 259L201 313", true), link("M421 259L519 313")],
  }],
  ["agentic-environments", {
    id: "article-action-observation", palette: "ice", title: "An agent acts; its environment responds",
    description: "An agent sends an action to a tool environment. A separate return channel carries observations and reward, making the interaction boundary explicit.",
    nodes: [node("chip", 215, 225, "tile", 112), node("globe", 508, 225, "window", 160, 112),
      node("plane", 362, 116, "bare", 56), node("wave", 362, 334, "bare", 56)],
    connections: [link("M215 169V131Q215 116 231 116H323"), link("M397 116H492Q508 116 508 132V159"),
      link("M508 281V318Q508 334 492 334H401"), link("M327 334H231Q215 334 215 318V291")],
  }],
  ["training-state", {
    id: "article-distributed-training", palette: "rose", title: "Coordinate data, workers, and optimization",
    description: "Compute workers share a synchronization bus. Training state reaches that bus, and the collected update returns through an optimizer. The worker count is illustrative.",
    nodes: [node("chip", 194, 136, "tile", 84), node("chip", 360, 136, "tile", 84), node("chip", 526, 136, "tile", 84),
      node("database", 194, 320, "circle", 90), node("gear", 526, 320, "circle", 90)],
    connections: [link("M194 178V222", false, false), link("M360 178V222", false, false),
      link("M526 178V222", false, false), link("M194 222H526", false, false),
      link("M194 275V232"), link("M526 222V265"), link("M481 320H249", true)],
  }],
]);

/** Constant-time identity lookup separates editorial selection from drawing. */
export function getHomeCover(section: string, visualId?: string): HomeCover | undefined {
  if (visualId) return homeArticleCovers.get(visualId);
  return Object.hasOwn(homeDomainCovers, section) ? homeDomainCovers[section] : undefined;
}
