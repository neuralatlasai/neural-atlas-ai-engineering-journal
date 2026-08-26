/**
 * URL construction under a sub-path deployment (GitHub Pages project sites).
 *
 * `lib/site.ts` reads the deployment prefix once, at module load, so the only
 * way to exercise it is to set the variable before importing. `node --test`
 * runs each file in its own process, which is what makes that safe: the other
 * suites — which assert the root-served form — are unaffected.
 *
 * This is the half of the behaviour that is easy to leave untested, because
 * every local build and every other test runs without a prefix. It is also the
 * half that only breaks in production.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const PREFIX = "/example-repo";
const ORIGIN = "https://example.github.io";

type SiteModule = typeof import("../lib/site");
type LlmsModule = typeof import("../lib/content/llms");
let site: SiteModule;
let llms: LlmsModule;

before(async () => {
  process.env.NEXT_PUBLIC_BASE_PATH = PREFIX;
  process.env.NEXT_PUBLIC_SITE_URL = ORIGIN;
  site = await import("../lib/site");
  llms = await import("../lib/content/llms");
});

describe("sub-path deployment", () => {
  it("prefixes a site-relative path", () => {
    assert.equal(site.withBasePath("/feed.xml"), `${PREFIX}/feed.xml`);
    assert.equal(site.withBasePath("feed.xml"), `${PREFIX}/feed.xml`);
  });

  it("prefixes hand-written hrefs, which Next does not touch", () => {
    // `next/link` gets the prefix from `basePath`; a raw anchor does not.
    assert.equal(site.internalHref("/models/glm-5-2"), `${PREFIX}/models/glm-5-2/`);
    assert.equal(site.internalHref("/models/glm-5-2#mla"), `${PREFIX}/models/glm-5-2/#mla`);
  });

  it("prefixes the search path used by the form action and location.assign", () => {
    assert.equal(site.SEARCH_PATH, `${PREFIX}/search/`);
    assert.equal(site.searchUrl("mla"), `${PREFIX}/search/?q=mla`);
  });

  it("keeps the prefix in absolute URLs, which feed canonicals and the sitemap", () => {
    // Regression: these were resolved against `metadataBase`, and a
    // leading-slash path resolves against the origin — silently dropping the
    // prefix from every canonical link.
    assert.equal(site.absoluteUrl("/about"), `${ORIGIN}${PREFIX}/about/`);
    assert.equal(site.absoluteUrl("/"), `${ORIGIN}${PREFIX}/`);
  });

  it("does not prefix a URL that already carries the prefix", () => {
    // Manifest image URLs arrive already prefixed. Passing one to `absoluteUrl`
    // would apply the prefix twice and 404.
    const fromManifest = `${PREFIX}/content-assets/x/overview-1600.png`;
    assert.equal(site.absoluteAssetUrl(fromManifest), `${ORIGIN}${fromManifest}`);
    assert.ok(
      !site.absoluteAssetUrl(fromManifest).includes(`${PREFIX}${PREFIX}`),
      "the prefix must not appear twice",
    );
  });

  it("keeps every llms.txt link inside the deployed sub-path", () => {
    // The file is read with no page to resolve against, so a link that lost the
    // prefix is a dead link rather than a cosmetic defect.
    const index = llms.buildLlmsTxt();
    const urls = [...index.matchAll(/\]\((\S+?)\)/g)].map((match) => match[1]);
    assert.ok(urls.length > 0);
    for (const url of urls) {
      assert.ok(url.startsWith(`${ORIGIN}${PREFIX}/`), url);
      assert.ok(!url.includes(`${PREFIX}${PREFIX}`), `prefix applied twice: ${url}`);
    }
    assert.ok(index.includes(`${ORIGIN}${PREFIX}${llms.LLMS_FULL_TXT_PATH}`));
  });

  it("produces parseable absolute URLs", () => {
    for (const path of ["/", "/about", "/models/x", "/feed.xml"]) {
      assert.doesNotThrow(() => new URL(site.absoluteUrl(path)));
    }
  });
});
