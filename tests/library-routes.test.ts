import { describe, it } from "node:test";
import assert from "node:assert/strict";
import LibraryPage, { generateMetadata, generateStaticParams } from "../app/library/[[...path]]/page";
import { getContentFolders } from "../lib/content/corpus";
import { absoluteUrl } from "../lib/site";

describe("unified static library route", () => {
  it("exports the root and every nested collection exactly once", () => {
    const paths = generateStaticParams().map(({ path }) => path.join("/"));
    const expected = ["", ...getContentFolders().filter(({ depth }) => depth > 1).map(({ key }) => key)];
    assert.equal(new Set(paths).size, paths.length);
    assert.deepEqual(new Set(paths), new Set(expected));
  });

  it("preserves root and nested canonical metadata", async () => {
    const root = await generateMetadata({ params: Promise.resolve({}) });
    assert.equal(root.alternates?.canonical, absoluteUrl("/library"));
    assert.deepEqual(root, await generateMetadata({ params: Promise.resolve({ path: [] }) }));
    const folder = getContentFolders().find(({ depth }) => depth > 1);
    assert.ok(folder);
    const metadata = await generateMetadata({ params: Promise.resolve({ path: folder.routeSegments }) });
    assert.equal(metadata.alternates?.canonical, absoluteUrl(folder.route));
    assert.equal(metadata.title, folder.labels.join(" · "));
  });

  it("keeps unknown collections and section aliases outside the exported library routes", async () => {
    for (const path of [["unknown-collection"], ["models"]]) {
      assert.deepEqual(await generateMetadata({ params: Promise.resolve({ path }) }), {});
      await assert.rejects(LibraryPage({ params: Promise.resolve({ path }) }), /NEXT_HTTP_ERROR_FALLBACK;404/);
    }
  });
});
