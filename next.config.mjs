import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default function config(phase) {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;
  // Normalized to `/prefix` (no trailing slash), matching `lib/site.ts`.
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

  return {
    // Pin the workspace root to this project (a stray lockfile lives higher up).
    outputFileTracingRoot: __dirname,

    /**
     * Static-first policy (plan §2.3): `next build` prerenders everything to a
     * deployable static bundle in ./out, and no server runtime is required.
     *
     * Deliberately *not* applied to `next dev`. `output: "export"` does its real
     * work at build time; in the dev server it only adds a guard that turns
     * every unmatched URL into a 500. Because the app has a root-level catch-all
     * (`app/[...slug]`), that guard fired for anything the router should simply
     * miss — `/site.webmanifest`, `/apple-touch-icon.png`, webpack HMR probes,
     * and any mistyped path — so `not-found.tsx` could never render locally and
     * the console filled with "missing param" errors.
     *
     * Nothing is lost by scoping it: the export constraints are still enforced
     * on every `npm run build`, which is the gate that matters, and the build
     * fails loudly if a route cannot be statically rendered.
     */
    /**
     * Development and production must never mutate the same compiler state.
     * `next dev` writes `.next-dev`; `next build` retains Next's default
     * `.next` directory and still exports to `./out`. Scoping `distDir` to the
     * development phase avoids the export relocation problem a global custom
     * directory causes while making a concurrent or interrupted production
     * build incapable of truncating a manifest underneath the dev server.
     */
    ...(isDevServer ? { distDir: ".next-dev" } : {}),
    ...(isDevServer ? {} : { output: "export" }),

    /**
     * Sub-path deployments (plan §2.3 — GitHub Pages project sites).
     *
     * Pages serves a project repository from `https://<org>.github.io/<repo>/`,
     * so the site has to know it lives under a prefix or every `_next/*` asset
     * and every router link resolves against the domain root.
     *
     * This covers only what Next owns — `next/link`, the router, and its own
     * asset URLs. URLs the content compiler bakes into raw HTML, and any
     * `fetch`/`<a href>`/form `action`, are invisible to it; those go through
     * `withBasePath` in `lib/site.ts`, which reads the same variable.
     *
     * Left unset for local development and for root deployments (a custom
     * domain or a `<user>.github.io` repository), where the prefix must be
     * empty.
     */
    ...(basePath ? { basePath, assetPrefix: basePath } : {}),

    images: {
      // Static export cannot use the on-demand optimizer; assets are
      // pre-sized and served as immutable files.
      unoptimized: true,
    },
    trailingSlash: true,
    reactStrictMode: true,

    /**
     * Next generates a random build ID per build and embeds it in every page and
     * in the `_next/static/<buildId>/` manifest paths, so two builds of identical
     * sources are never byte-identical. Setting `NEXT_BUILD_ID` pins it, which is
     * what lets the determinism gate (plan §3.2, §27) compare two builds.
     *
     * Returning `null` keeps Next's default for ordinary builds, so normal
     * deployments still get a fresh ID and correct manifest cache-busting.
     */
    generateBuildId: () => process.env.NEXT_BUILD_ID ?? null,
  };
}
