import { angleLabel } from "./angles";
import { profiles, type Profile } from "./profiles";

/**
 * Распознавание детали по нескольким снимкам. Пока это демо: снимок узнаётся по отпечатку
 * (dHash, см. `imageFingerprint`) среди эталонных ракурсов из `profiles.ts`. Чем больше
 * разных ракурсов совпало, тем выше уверенность — так и будет у настоящей модели.
 * Интерфейс (снимки с ракурсами на входе, `Recognition` на выходе) останется прежним.
 */

export type RecognitionPhoto = {
  angle: string;
  /** Что ИИ увидел на этом снимке. */
  note: string;
  matched: boolean;
};

export type Recognition = {
  status: "recognized" | "unsure";
  profileId: string | null;
  title: string;
  /** Импортный оригинал: бренд и артикул. */
  original: string | null;
  category: string | null;
  /** От 0 до 1. */
  confidence: number;
  attributes: [string, string][];
  photos: RecognitionPhoto[];
  /** Как поднять уверенность: каких ракурсов не хватает. */
  tips: string[];
};

/** Сколько бит из 64 могут отличаться, чтобы снимок считался тем же. */
const MAX_DISTANCE = 4;

export function hammingDistance(a: string, b: string): number {
  if (!/^[0-9a-f]{16}$/.test(a) || !/^[0-9a-f]{16}$/.test(b)) return 64;
  let bits = 0;
  for (let i = 0; i < 16; i += 4) {
    let x = parseInt(a.slice(i, i + 4), 16) ^ parseInt(b.slice(i, i + 4), 16);
    while (x) {
      bits += x & 1;
      x >>= 1;
    }
  }
  return bits;
}

/** Уверенность по числу совпавших ракурсов: один — 71%, все эталонные — 98%. */
export function confidenceFor(matched: number, total: number): number {
  if (matched === 0) return 0;
  if (total <= 1) return 0.98;
  return Math.round((0.71 + (0.27 * (matched - 1)) / (total - 1)) * 100) / 100;
}

export function recognize(photos: { angle: string; fingerprint: string }[]): Recognition {
  let best: { profile: Profile; refs: Set<number>; perPhoto: (number | null)[] } | null = null;
  for (const profile of profiles) {
    // Каждый снимок — к ближайшему эталону этой детали, если он достаточно похож.
    const perPhoto = photos.map((photo) => {
      const distances = profile.references.map((ref) =>
        hammingDistance(photo.fingerprint, ref.fingerprint),
      );
      const nearest = Math.min(...distances);
      return nearest <= MAX_DISTANCE ? distances.indexOf(nearest) : null;
    });
    const refs = new Set(perPhoto.filter((i): i is number => i !== null));
    if (refs.size > (best?.refs.size ?? 0)) best = { profile, refs, perPhoto };
  }

  if (!best) {
    return {
      status: "unsure",
      profileId: null,
      title: "Деталь не распознана уверенно",
      original: null,
      category: null,
      confidence: 0,
      attributes: [],
      photos: photos.map((p) => ({
        angle: p.angle,
        note: "Не удалось сопоставить с известными деталями",
        matched: false,
      })),
      tips: [
        "Снимите деталь на однотонном фоне, при дневном свете",
        "Добавьте крупный план маркировки или шильдика",
        "Подпишите, где стоит деталь: это сузит поиск",
      ],
    };
  }

  const { profile, refs, perPhoto } = best;
  const total = profile.references.length;
  const missing = profile.references.filter((_, i) => !refs.has(i));
  const tips = missing.length
    ? [
        `Добавьте ${missing.map((r) => `«${angleLabel(r.angle).toLowerCase()}»`).join(", ")} — уверенность вырастет до ${Math.round(confidenceFor(total, total) * 100)}%`,
      ]
    : [];
  return {
    status: "recognized",
    profileId: profile.id,
    title: profile.title,
    original: profile.original,
    category: profile.category,
    confidence: confidenceFor(refs.size, total),
    attributes: profile.attributes,
    photos: photos.map((p, i) => {
      const ref = perPhoto[i];
      return ref === null || ref === undefined
        ? {
            angle: p.angle,
            note: "Этот снимок не помог: другой предмет или плохо видно",
            matched: false,
          }
        : { angle: p.angle, note: profile.references[ref]!.note, matched: true };
    }),
    tips,
  };
}
