import type { HeroImage } from "@/lib/content/corpus";
import { withBasePath } from "@/lib/site";

interface HomeArtworkAsset {
  readonly avif: string;
  readonly fallback: string;
}

const HOME_ARTWORK: Readonly<Record<string, HomeArtworkAsset>> = {
  blogs: {
    avif: "/images/home/blogs.avif",
    fallback: "/images/home/blogs.webp",
  },
  components: {
    avif: "/images/home/components.avif",
    fallback: "/images/home/components.webp",
  },
  engineering: {
    avif: "/images/home/engineering.avif",
    fallback: "/images/home/engineering.webp",
  },
  models: {
    avif: "/images/home/models.avif",
    fallback: "/images/home/models.webp",
  },
  research: {
    avif: "/images/home/research.avif",
    fallback: "/images/home/research.webp",
  },
  training: {
    avif: "/images/home/training.avif",
    fallback: "/images/home/training.webp",
  },
};

const FEATURED_ARTWORK: HomeArtworkAsset = {
  avif: "/images/home/featured-agentic-cyber-defense.avif",
  fallback: "/images/home/featured-agentic-cyber-defense.webp",
};

const ARTICLE_ARTWORK: Readonly<Record<string, HomeArtworkAsset>> = {
  "/blogs/ai-capabilities-and-limitations-in-2026": {
    avif: "/images/home/article-ai-capabilities.avif",
    fallback: "/images/home/article-ai-capabilities.webp",
  },
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
 * Category artwork is decorative because the adjacent heading names the domain.
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
}: {
  section: string;
  articleRoute?: string;
  hero?: HeroImage | null;
  className?: string;
  priority?: boolean;
  variant?: "section" | "featured";
}) {
  const artwork =
    variant === "featured"
      ? FEATURED_ARTWORK
      : (articleRoute ? ARTICLE_ARTWORK[articleRoute] : undefined) ??
        HOME_ARTWORK[section] ??
        DEFAULT_ARTWORK;

  if (hero) {
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
    <figure className={className} aria-hidden="true">
      <picture>
        <source type="image/avif" srcSet={withBasePath(artwork.avif)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath(artwork.fallback)}
          alt=""
          width={1440}
          height={480}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </figure>
  );
}
