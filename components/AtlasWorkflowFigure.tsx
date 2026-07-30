const STAGES = [
  {
    number: "01",
    title: "Public evidence",
    items: ["Papers", "Technical reports", "Model cards", "Released code"],
  },
  {
    number: "02",
    title: "Reconstruction",
    items: ["Architecture", "Attention & memory", "Training systems", "Inference"],
  },
  {
    number: "03",
    title: "Evidence checks",
    items: ["Claim basis", "Units & config", "Provenance", "Uncertainty"],
  },
  {
    number: "04",
    title: "Published analysis",
    items: ["Mechanisms", "Constraints", "Open questions", "Source links"],
  },
] as const;

const STAGE_X = [15, 195, 375, 555] as const;

/**
 * This figure describes the publication's documented editorial method, not a
 * hypothetical neural-network architecture. Every label is grounded in the
 * evidence standards stated on `/about`, so the visual cannot imply technical
 * mechanisms that the corpus does not establish.
 */
export function AtlasWorkflowFigure() {
  return (
    <figure className="home-hero__visual">
      <svg
        className="atlas-workflow"
        viewBox="0 0 720 480"
        role="img"
        aria-labelledby="atlas-workflow-title atlas-workflow-description"
      >
        <title id="atlas-workflow-title">Neural Atlas evidence workflow</title>
        <desc id="atlas-workflow-description">
          Public papers, technical reports, model cards, and released code are
          reconstructed into mechanisms, checked for claim basis, configuration,
          provenance, and uncertainty, then published with constraints, open
          questions, and source links.
        </desc>
        <defs>
          <marker
            id="atlas-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path className="atlas-workflow__arrowhead" d="M0 0 8 4 0 8Z" />
          </marker>
        </defs>

        <rect className="atlas-workflow__canvas" width="720" height="480" rx="12" />

        {STAGES.slice(0, -1).map((_, index) => (
          <path
            className="atlas-workflow__connector"
            d={`M${STAGE_X[index] + 152} 240H${STAGE_X[index + 1] - 8}`}
            markerEnd="url(#atlas-arrow)"
            key={`connector-${index}`}
          />
        ))}

        {STAGES.map((stage, stageIndex) => {
          const x = STAGE_X[stageIndex];
          return (
            <g key={stage.number}>
              <rect
                className="atlas-workflow__stage"
                x={x}
                y="58"
                width="150"
                height="344"
                rx="8"
              />
              <text className="atlas-workflow__number" x={x + 14} y="86">
                {stage.number}
              </text>
              <text className="atlas-workflow__title" x={x + 14} y="119">
                {stage.title}
              </text>
              {stage.items.map((item, itemIndex) => {
                const itemY = 151 + itemIndex * 54;
                return (
                  <g key={item}>
                    <rect
                      className="atlas-workflow__item"
                      x={x + 12}
                      y={itemY}
                      width="126"
                      height="38"
                      rx="4"
                    />
                    <circle
                      className="atlas-workflow__node"
                      cx={x + 26}
                      cy={itemY + 19}
                      r="3.5"
                    />
                    <text
                      className="atlas-workflow__label"
                      x={x + 38}
                      y={itemY + 24}
                    >
                      {item}
                    </text>
                  </g>
                );
              })}
              <path
                className="atlas-workflow__spine"
                d={`M${x + 26} 170V332`}
              />
            </g>
          );
        })}

        <text className="atlas-workflow__principle" x="360" y="442" textAnchor="middle">
          Documented ≠ inferred ≠ unknown
        </text>
      </svg>
      <figcaption>
        From public evidence to mechanism-level analysis, with uncertainty kept visible.
      </figcaption>
    </figure>
  );
}
