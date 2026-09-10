import { withBasePath } from "../../lib/site";
import type { ArticleVisual } from "../../lib/visuals/types";
import { DiagramArtwork } from "./DiagramArtwork";
import styles from "./ArticleVisualFigure.module.css";

/**
 * Server-only progressive enhancement: a native checkbox controls CSS motion.
 * The complete image and explanation ship as HTML. No hydration, animation
 * library, canvas, or client-side corpus data is needed to understand a figure.
 */
export function ArticleVisualFigure({ visual }: { visual: ArticleVisual }) {
  const motionId = `${visual.id}-motion`;
  return <figure className={styles.figure} aria-labelledby={`${visual.id}-heading`} data-article-visual={visual.id}>
    <header className={styles.header}>
      <p className={styles.eyebrow}><span aria-hidden="true">◈</span> The visual intuition</p>
      <h2 id={`${visual.id}-heading`} className={styles.title}>{visual.title}</h2>
      <p className={styles.thesis}>{visual.thesis}</p>
    </header>
    {visual.layout !== "compare" && <input id={motionId} type="checkbox" className={styles.motionToggle} aria-label="Animate diagram flow" />}
    <div className={styles.toolbar}>
      {visual.layout !== "compare" && <label htmlFor={motionId} className={styles.motionLabel}>
        <span className={styles.play}><span aria-hidden="true">▷</span> Animate flow</span>
        <span className={styles.pause}><span aria-hidden="true">Ⅱ</span> Pause flow</span>
      </label>}
      <span className={styles.still}>Conceptual diagram</span>
      <a href={withBasePath(`/figures/${visual.id}.svg`)} download={`${visual.id}.svg`} className={styles.download}>Save figure <span aria-hidden="true">↗</span></a>
    </div>
    <div className={styles.canvas} tabIndex={0} role="region" aria-label={`${visual.title}; scroll horizontally on small screens`}>
      <DiagramArtwork visual={visual} />
    </div>
    <p className={styles.scrollHint}>Swipe or use arrow keys to explore the full diagram.</p>
    <figcaption className={styles.caption}>
      <span className={styles.captionMark} aria-hidden="true">↳</span>
      <div><p className={styles.relation}>{visual.relation}</p><p className={styles.note}>{visual.note}</p></div>
    </figcaption>
    <details className={styles.explanation}>
      <summary>Read the diagram <span aria-hidden="true">＋</span></summary>
      <ol>{visual.nodes.map((node) => <li key={node.label}><strong>{node.label}</strong><p>{node.explanation}</p></li>)}</ol>
    </details>
  </figure>;
}
