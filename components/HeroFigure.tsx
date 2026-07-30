import type { HeroImage } from "@/lib/content/corpus";

function srcset(list: { w: number; src: string }[]): string | undefined {
  return list.length
    ? list.map((v) => `${v.src} ${v.w}w`).join(", ")
    : undefined;
}

/**
 * Responsive hero image (plan §15.2). Emits AVIF → WebP → original-family
 * fallback with a `srcset`, plus intrinsic `width`/`height` so the box is
 * reserved before decode (no layout shift). `priority` marks the actual LCP
 * image; everything else lazy-loads.
 */
export function HeroFigure({
  hero,
  className,
  sizes = "(max-width: 60rem) calc(100vw - 32px), (min-width: 140rem) 880px, (min-width: 100rem) 832px, (min-width: 80rem) 784px, 608px",
  priority = false,
  caption,
}: {
  hero: HeroImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
  caption?: string;
}) {
  return (
    <figure className={className}>
      <picture>
        {hero.avif.length > 0 && (
          <source type="image/avif" srcSet={srcset(hero.avif)} sizes={sizes} />
        )}
        {hero.webp.length > 0 && (
          <source type="image/webp" srcSet={srcset(hero.webp)} sizes={sizes} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.src}
          alt={hero.alt}
          width={hero.width ?? undefined}
          height={hero.height ?? undefined}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
      {caption && (
        <figcaption className="hero-figure__caption">{caption}</figcaption>
      )}
    </figure>
  );
}
