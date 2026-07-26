import type { HeroImage } from "@/lib/content/corpus";

function srcset(list: { w: number; src: string }[]): string | undefined {
  return list.length ? list.map((v) => `${v.src} ${v.w}w`).join(", ") : undefined;
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
  // Matches the fixed reading measure (--measure: 38rem = 608px).
  sizes = "(max-width: 1024px) 100vw, 608px",
  priority = false,
}: {
  hero: HeroImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <figure className={className}>
      <picture>
        {hero.avif.length > 0 && <source type="image/avif" srcSet={srcset(hero.avif)} sizes={sizes} />}
        {hero.webp.length > 0 && <source type="image/webp" srcSet={srcset(hero.webp)} sizes={sizes} />}
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
    </figure>
  );
}
