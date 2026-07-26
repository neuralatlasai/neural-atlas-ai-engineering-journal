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
     * `distDir` is deliberately left at its default.
     *
     * Pointing it elsewhere to stop `next build` from clobbering a running dev
     * server's `.next` does not work: with `output: "export"` it relocates the
     * *exported site* rather than the compilation cache, so `./out` silently
     * goes stale and the postbuild gates end up validating the previous build.
     * The dev/build conflict is handled by not running them concurrently (see
     * the workflow note in the README).
     */
    ...(isDevServer ? {} : { output: "export" }),

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
