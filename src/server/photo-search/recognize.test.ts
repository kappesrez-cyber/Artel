import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { profiles } from "./profiles";
import { confidenceFor, hammingDistance, recognize } from "./recognize";

const bearing = profiles.find((p) => p.id === "bearing-6205")!;
const photos = (fingerprints: string[]) =>
  fingerprints.map((fingerprint) => ({ angle: "front", fingerprint }));

describe("распознавание по фото", () => {
  it("эталонные снимки лежат в public, их можно скачать и попробовать", () => {
    for (const ref of profiles.flatMap((p) => p.references)) {
      expect(
        existsSync(join(import.meta.dirname, "../../../public/demo/photo-search", ref.file)),
      ).toBe(true);
    }
  });

  it("расстояние Хэмминга между отпечатками", () => {
    expect(hammingDistance("0000000000000000", "000000000000000f")).toBe(4);
    expect(hammingDistance("ffffffffffffffff", "ffffffffffffffff")).toBe(0);
    expect(hammingDistance("", "ffffffffffffffff")).toBe(64);
  });

  it("эталоны разных деталей не путаются между собой", () => {
    for (const a of profiles) {
      for (const b of profiles) {
        if (a === b) continue;
        for (const ra of a.references) {
          for (const rb of b.references) {
            expect(hammingDistance(ra.fingerprint, rb.fingerprint)).toBeGreaterThan(4);
          }
        }
      }
    }
  });

  it("чем больше ракурсов совпало, тем выше уверенность", () => {
    const one = recognize(photos([bearing.references[0]!.fingerprint]));
    const all = recognize(photos(bearing.references.map((r) => r.fingerprint)));
    expect(one.profileId).toBe("bearing-6205");
    expect(one.confidence).toBe(confidenceFor(1, 4));
    expect(one.tips).toHaveLength(1);
    expect(all.confidence).toBe(0.98);
    expect(all.tips).toEqual([]);
    expect(all.photos.every((p) => p.matched)).toBe(true);
  });

  it("одинаковые снимки не накручивают уверенность", () => {
    const ref = bearing.references[0]!.fingerprint;
    expect(recognize(photos([ref, ref, ref])).confidence).toBe(confidenceFor(1, 4));
  });

  it("незнакомое фото — честное «не уверен»", () => {
    const r = recognize(photos(["0123456789abcdef"]));
    expect(r.status).toBe("unsure");
    expect(r.confidence).toBe(0);
  });
});
