const EVIDENCE = [
  "Papers",
  "Technical reports",
  "Model cards",
  "Released code",
] as const;

const RECONSTRUCTION = [
  "Architecture",
  "Attention & memory",
  "Training systems",
  "Inference",
] as const;

const AUDIT = ["Claim basis", "Units & config", "Provenance", "Uncertainty"] as const;

const PUBLICATION = ["Mechanisms", "Constraints", "Open questions", "Source links"] as const;

const EVIDENCE_Y = [138, 196, 254, 312] as const;
const RECONSTRUCTION_Y = [132, 190, 248, 306] as const;

const GRAPH_EDGES = [
  "M266 142C304 142 315 165 347 174",
  "M266 200C304 200 306 209 338 220",
  "M266 258C300 258 316 252 354 246",
  "M266 316C312 316 322 290 362 278",
  "M347 174L410 139",
  "M347 174L425 214",
  "M338 220L389 260",
  "M354 246L425 214",
  "M354 246L443 286",
  "M362 278L389 260",
  "M389 260L443 286",
  "M410 139L484 176",
  "M425 214L495 230",
  "M443 286L486 300",
] as const;

const GRAPH_NODES = [
  { x: 347, y: 174, kind: "reported", label: "R" },
  { x: 338, y: 220, kind: "verified", label: "C" },
  { x: 354, y: 246, kind: "reported", label: "R" },
  { x: 362, y: 278, kind: "verified", label: "C" },
  { x: 410, y: 139, kind: "reported", label: "R" },
  { x: 425, y: 214, kind: "focus", label: "D" },
  { x: 389, y: 260, kind: "derived", label: "D" },
  { x: 443, y: 286, kind: "unknown", label: "U" },
  { x: 484, y: 176, kind: "derived", label: "D" },
  { x: 495, y: 230, kind: "verified", label: "C" },
  { x: 486, y: 300, kind: "unknown", label: "U" },
] as const;

/**
 * A deterministic provenance map for the publication's documented method.
 * It visualizes evidence relationships—not a neural architecture—so every
 * label remains true for every article in the corpus.
 */
export function AtlasWorkflowFigure() {
  return (
    <figure className="atlas-workflow-figure">
      <svg
        className="atlas-workflow atlas-workflow--desktop"
        viewBox="0 0 760 500"
        role="img"
        aria-labelledby="atlas-workflow-title atlas-workflow-description"
      >
        <title id="atlas-workflow-title">Neural Atlas evidence topology</title>
        <desc id="atlas-workflow-description">
          Papers, technical reports, model cards, and released code are connected
          through a provenance graph. Reported, code-verified, derived, and
          undisclosed claims are audited before architecture, attention, training,
          inference, mechanisms, constraints, open questions, and source links are
          published.
        </desc>

        <rect className="atlas-workflow__canvas" x="1" y="1" width="758" height="498" rx="16" />

        <g className="atlas-workflow__grid" aria-hidden="true">
          {[96, 182, 268, 354, 440, 526, 612, 698].map((x) => (
            <path d={`M${x} 82V362`} key={`grid-x-${x}`} />
          ))}
          {[82, 152, 222, 292, 362].map((y) => (
            <path d={`M32 ${y}H728`} key={`grid-y-${y}`} />
          ))}
        </g>

        <text className="atlas-workflow__overline" x="32" y="45">
          EVIDENCE TOPOLOGY
        </text>
        <text className="atlas-workflow__coordinate" x="728" y="45" textAnchor="end">
          PROVENANCE MAP
        </text>

        <g aria-label="Public evidence">
          <text className="atlas-workflow__section" x="32" y="98">
            01 / PUBLIC EVIDENCE
          </text>
          {EVIDENCE.map((label, index) => (
            <g key={label}>
              <text className="atlas-workflow__index" x="38" y={EVIDENCE_Y[index] + 4}>
                {String(index + 1).padStart(2, "0")}
              </text>
              <circle className="atlas-workflow__source-node" cx="78" cy={EVIDENCE_Y[index]} r="4" />
              <path
                className="atlas-workflow__source-line"
                d={`M82 ${EVIDENCE_Y[index]}H266`}
              />
              <text className="atlas-workflow__label" x="94" y={EVIDENCE_Y[index] + 5}>
                {label}
              </text>
            </g>
          ))}
        </g>

        <g aria-label="Claim provenance graph">
          <circle className="atlas-workflow__field" cx="415" cy="226" r="130" />
          <circle className="atlas-workflow__field atlas-workflow__field--inner" cx="415" cy="226" r="82" />
          {GRAPH_EDGES.map((edge) => (
            <path className="atlas-workflow__edge" d={edge} key={edge} />
          ))}
          {GRAPH_NODES.map((node) => (
            <g key={`${node.x}-${node.y}`}>
              <circle
                className={`atlas-workflow__graph-node atlas-workflow__graph-node--${node.kind}`}
                cx={node.x}
                cy={node.y}
                r={node.kind === "focus" ? 17 : 10}
              />
              <text
                className={`atlas-workflow__node-label atlas-workflow__node-label--${node.kind}`}
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
              >
                {node.label}
              </text>
            </g>
          ))}
          <path className="atlas-workflow__focus-ring" d="M394 214A32 32 0 1 1 425 246" />
          <text className="atlas-workflow__micro-label" x="414" y="345" textAnchor="middle">
            CLAIM GRAPH / TRACEABLE EDGES
          </text>
        </g>

        <g aria-label="System reconstruction">
          <text className="atlas-workflow__section" x="568" y="98">
            02 / RECONSTRUCT
          </text>
          {RECONSTRUCTION.map((label, index) => (
            <g key={label}>
              <path
                className="atlas-workflow__output-line"
                d={`M520 ${RECONSTRUCTION_Y[index]}H554`}
              />
              <circle
                className="atlas-workflow__output-node"
                cx="558"
                cy={RECONSTRUCTION_Y[index]}
                r="4"
              />
              <text className="atlas-workflow__label" x="574" y={RECONSTRUCTION_Y[index] + 5}>
                {label}
              </text>
            </g>
          ))}
        </g>

        <g aria-label="Evidence audit" transform="translate(32 390)">
          <text className="atlas-workflow__section" x="0" y="0">
            03 / AUDIT
          </text>
          {AUDIT.map((label, index) => (
            <text className="atlas-workflow__audit-label" x={index * 126} y="33" key={label}>
              {label}
            </text>
          ))}
        </g>

        <g aria-label="Published analysis" transform="translate(536 390)">
          <text className="atlas-workflow__section" x="0" y="0">
            04 / PUBLISH
          </text>
          {PUBLICATION.map((label, index) => (
            <text
              className="atlas-workflow__publication-label"
              x={(index % 2) * 96}
              y={33 + Math.floor(index / 2) * 27}
              key={label}
            >
              {label}
            </text>
          ))}
        </g>

        <g className="atlas-workflow__legend" transform="translate(32 470)">
          <text x="0">[R] reported</text>
          <text x="120">[C] code-verified</text>
          <text x="278">[D] derived</text>
          <text x="390">[U] undisclosed</text>
          <text className="atlas-workflow__principle" x="696" textAnchor="end">
            Documented ≠ inferred ≠ unknown
          </text>
        </g>
      </svg>

      <svg
        className="atlas-workflow atlas-workflow--mobile"
        viewBox="0 0 360 500"
        role="img"
        aria-labelledby="atlas-workflow-mobile-title atlas-workflow-mobile-description"
      >
        <title id="atlas-workflow-mobile-title">Neural Atlas evidence topology</title>
        <desc id="atlas-workflow-mobile-description">
          Four public evidence sources converge into a provenance graph, then
          pass through reconstruction and evidence-audit stages before publication.
        </desc>
        <rect className="atlas-workflow__canvas" x="1" y="1" width="358" height="498" rx="16" />
        <text className="atlas-workflow__overline" x="20" y="34">
          EVIDENCE TOPOLOGY
        </text>
        <text className="atlas-workflow__coordinate" x="340" y="34" textAnchor="end">
          PROVENANCE MAP
        </text>

        <text className="atlas-workflow__section" x="20" y="70">
          01 / PUBLIC EVIDENCE
        </text>
        {EVIDENCE.map((label, index) => {
          const x = index % 2 === 0 ? 20 : 190;
          const y = index < 2 ? 99 : 133;
          return (
            <g key={`mobile-${label}`}>
              <circle className="atlas-workflow__source-node" cx={x + 4} cy={y - 4} r="4" />
              <text className="atlas-workflow__label" x={x + 16} y={y}>
                {label}
              </text>
              <path
                className="atlas-workflow__source-line"
                d={`M${x + 4} ${y + 8}C${x + 4} 165 180 158 180 176`}
              />
            </g>
          );
        })}

        <g aria-label="Claim provenance graph">
          <circle className="atlas-workflow__field" cx="180" cy="240" r="74" />
          <circle className="atlas-workflow__field atlas-workflow__field--inner" cx="180" cy="240" r="46" />
          <path className="atlas-workflow__edge" d="M128 220L166 198L210 214L224 259L183 282L142 260Z" />
          <path className="atlas-workflow__edge" d="M166 198L183 282M128 220L224 259M142 260L210 214" />
          {[
            { x: 128, y: 220, kind: "reported", label: "R" },
            { x: 166, y: 198, kind: "verified", label: "C" },
            { x: 210, y: 214, kind: "derived", label: "D" },
            { x: 224, y: 259, kind: "unknown", label: "U" },
            { x: 183, y: 282, kind: "verified", label: "C" },
            { x: 142, y: 260, kind: "reported", label: "R" },
          ].map((node) => (
            <g key={`mobile-node-${node.x}-${node.y}`}>
              <circle
                className={`atlas-workflow__graph-node atlas-workflow__graph-node--${node.kind}`}
                cx={node.x}
                cy={node.y}
                r="11"
              />
              <text
                className={`atlas-workflow__node-label atlas-workflow__node-label--${node.kind}`}
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
              >
                {node.label}
              </text>
            </g>
          ))}
          <text className="atlas-workflow__micro-label" x="180" y="330" textAnchor="middle">
            TRACEABLE CLAIM GRAPH
          </text>
        </g>

        <text className="atlas-workflow__section" x="20" y="366">
          02 / RECONSTRUCT
        </text>
        {RECONSTRUCTION.map((label, index) => (
          <text
            className="atlas-workflow__publication-label"
            x={index % 2 === 0 ? 20 : 190}
            y={394 + Math.floor(index / 2) * 27}
            key={`mobile-reconstruction-${label}`}
          >
            {label}
          </text>
        ))}

        <path className="atlas-workflow__output-line" d="M20 445H340" />
        <text className="atlas-workflow__section" x="20" y="466">
          03 / AUDIT
        </text>
        <text className="atlas-workflow__section" x="340" y="466" textAnchor="end">
          04 / PUBLISH
        </text>
        <g className="atlas-workflow__legend" transform="translate(20 486)">
          <text x="0">[R] reported</text>
          <text x="92">[C] verified</text>
          <text x="184">[D] derived</text>
          <text x="268">[U] unknown</text>
        </g>
      </svg>
      <figcaption>
        A claim stays connected to its source, derivation, and uncertainty.
      </figcaption>
    </figure>
  );
}
