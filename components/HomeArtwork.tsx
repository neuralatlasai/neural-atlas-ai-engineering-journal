import React from "react";
import type { HeroImage } from "@/lib/content/corpus";
import { withBasePath } from "@/lib/site";
import { articleVisuals } from "@/lib/visuals/catalog";
import type { ArticleVisual } from "@/lib/visuals/types";
import { CoverArtwork } from "@/components/visuals/CoverArtwork";

// One O(n) catalog pass provides O(1) section previews, including future sections.
const domainVisuals = new Map<string, ArticleVisual>();
for (const visual of articleVisuals) {
  const section = visual.source.split("/")[1].toLowerCase();
  if (!domainVisuals.has(section)) domainVisuals.set(section, visual);
}

interface HomeArtworkAsset {
  readonly avif: string;
  readonly fallback: string;
  readonly alt: string;
}

const HOME_ARTWORK: Readonly<Record<string, HomeArtworkAsset>> = {
  blogs: {
    avif: "/images/home/blogs.avif",
    fallback: "/images/home/blogs.webp",
    alt: "Cyber-defense loop: attack execution, telemetry, detection synthesis, validation, deployment, and fresh attack.",
  },
  components: {
    avif: "/images/home/components.avif",
    fallback: "/images/home/components.webp",
    alt: "GRPO: response-group rewards produce relative advantages for a policy update.",
  },
  engineering: {
    avif: "/images/home/engineering.avif",
    fallback: "/images/home/engineering.webp",
    alt: "Immutable evidence becomes structural IR, a versioned knowledge fabric, and derived projections.",
  },
  models: {
    avif: "/images/home/models.avif",
    fallback: "/images/home/models.webp",
    alt: "Routed MoE path: token state, router, selected experts, and weighted sum.",
  },
  research: {
    avif: "/images/home/research.avif",
    fallback: "/images/home/research.webp",
    alt: "An agent uses interaction history to select actions; the environment returns observations and rewards.",
  },
  training: {
    avif: "/images/home/training.avif",
    fallback: "/images/home/training.webp",
    alt: "A forward pass produces a loss and gradients for an optimizer update.",
  },
};

const FEATURED_ARTWORK: HomeArtworkAsset = {
  avif: "/images/home/featured-agentic-cyber-defense.avif",
  fallback: "/images/home/featured-agentic-cyber-defense.webp",
  alt: HOME_ARTWORK.blogs.alt,
};

const ARTICLE_ARTWORK: Readonly<Record<string, HomeArtworkAsset>> = {
  "/blogs/ai-capabilities-and-limitations-in-2026": {
    avif: "/images/home/article-ai-capabilities.avif",
    fallback: "/images/home/article-ai-capabilities.webp",
    alt: "Model output and evidence enter verification; supported output is accepted, otherwise retried or escalated.",
  },
  "/blogs/adaptive-agentic-cyber-defense-with-nvidia-nemotron": FEATURED_ARTWORK,
  "/components/rl-grpo": HOME_ARTWORK.components,
  "/engineering/corpus-technical": HOME_ARTWORK.engineering,
  "/models/deepseek-v4-pro": HOME_ARTWORK.models,
  "/research/agentic-environment-engineering-for-large-language-models": HOME_ARTWORK.research,
  "/research/frontier-reasoning-agent-systems": HOME_ARTWORK.research,
  "/training/deepseek-qwen-and-glm-training-systems": HOME_ARTWORK.training,
};

const DEFAULT_ARTWORK = HOME_ARTWORK.research;

function responsiveSrcSet(
  candidates: readonly { readonly w: number; readonly src: string }[],
): string | undefined {
  return candidates.length > 0
    ? candidates.map(({ w, src }) => `${src} ${w}w`).join(", ")
    : undefined;
}

/**
 * These source-grounded diagrams carry information, so their mechanisms need
 * accessible alternatives rather than decorative, empty-alt treatment.
 * A syntax-level fallback keeps newly discovered corpus sections renderable
 * without coupling homepage correctness to a route registry update.
 */
export function HomeArtwork({
  section,
  articleRoute,
  hero,
  className,
  priority = false,
  variant = "section",
  visual,
}: {
  section: string;
  articleRoute?: string;
  hero?: HeroImage | null;
  className?: string;
  priority?: boolean;
  variant?: "section" | "featured";
  visual?: ArticleVisual;
}) {
  const preview = visual ?? (!articleRoute ? domainVisuals.get(section) : undefined);
  if (preview) {
    return <figure className={className}>
      <CoverArtwork visual={preview} idPrefix={articleRoute
        ? `${variant}-${preview.id}` : `domain-${section}`} />
    </figure>;
  }
  const artwork =
    variant === "featured"
      ? FEATURED_ARTWORK
      : (articleRoute ? ARTICLE_ARTWORK[articleRoute] : undefined) ??
        HOME_ARTWORK[section] ??
        DEFAULT_ARTWORK;

  // An exact article mapping takes precedence over legacy hero artwork. Other
  // articles retain their own authored figure instead of receiving a false
  // article-specific diagram merely because they share a section.
  const hasArticleArtwork = articleRoute !== undefined && ARTICLE_ARTWORK[articleRoute] !== undefined;
  if (hero && !hasArticleArtwork) {
    return (
      <figure className={className} aria-hidden="true">
        <picture>
          {hero.avif.length > 0 && (
            <source
              type="image/avif"
              srcSet={responsiveSrcSet(hero.avif)}
              sizes="(max-width: 48rem) 100vw, 33vw"
            />
          )}
          {hero.webp.length > 0 && (
            <source
              type="image/webp"
              srcSet={responsiveSrcSet(hero.webp)}
              sizes="(max-width: 48rem) 100vw, 33vw"
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.src}
            alt=""
            width={hero.width ?? 1440}
            height={hero.height ?? 480}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : "auto"}
          />
        </picture>
      </figure>
    );
  }

  return (
    <figure className={className}>
      <picture>
        <source type="image/avif" srcSet={withBasePath(artwork.avif)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath(artwork.fallback)}
          alt={artwork.alt}
          width={1440}
          height={720}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </figure>
  );
}
