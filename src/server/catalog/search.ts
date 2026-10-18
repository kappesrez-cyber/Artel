import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { parseQuery, queryScope, requiredMatches, stem, type ParsedQuery } from "./search-text";

/**
 * Поиск покупателя по каталогу. Всё считает PostgreSQL, без внешних сервисов:
 *
 * 1. Каждое слово запроса ищется полнотекстово с русской морфологией (`searchVector`,
 *    словарь `russian`): «подшипники», «подшипника» и «подшипник» — одно слово.
 *    К слову добавляются синонимы («сальник» → «манжета», «уплотнение», «seal») и вариант
 *    в русской раскладке («gjlibgybr» → «подшипник»).
 * 2. Слово, которого нет ни в одной карточке, исправляется по словарю каталога: расстояние
 *    Левенштейна до 1–2 букв (`fuzzystrmatch`, «подшибник» → «подшипник») или общее начало
 *    («гидравлики» → «гидравлический»). Исправленное совпадение весит меньше точного.
 * 3. Слова-артикулы дополнительно ищутся слитно в `searchText` (индекс `pg_trgm`):
 *    «6205 2RS», «6205-2RS» и «62052рс» находят одну позицию, в том числе по артикулу
 *    импортного аналога, который она заменяет.
 * 4. Позиция попадает в выдачу, если покрыла достаточно слов (`requiredMatches`). Если так
 *    не нашлось ничего, показываем позиции, где совпала хотя бы часть слов.
 * 5. Порядок: сколько слов совпало, совпадение артикула, слова в названии, вес полей
 *    (название и артикулы важнее описания), и только потом репутация продавца: рейтинг,
 *    успешные сделки, проверенные реквизиты, свежесть карточки.
 */

export type SearchMode =
  /** Пустой запрос: все предложения, сначала надёжные продавцы. Запрос из одних знаков («...») — не пустой. */
  | "all"
  /** Совпали все нужные слова. */
  | "exact"
  /** Нашлось только после исправления опечаток. */
  | "typos"
  /** Точных совпадений нет: показаны позиции, где совпала часть слов. */
  | "partial";

export type SearchOutcome = {
  mode: SearchMode;
  /** id позиций по убыванию релевантности. */
  ids: string[];
  parsed: ParsedQuery;
  /** Исправления опечаток: слово запроса → слова каталога. */
  corrections: Record<string, string[]>;
};

/** Репутация продавца и свежесть карточки, 0…1. Влияет на порядок, но не на попадание в выдачу. */
const quality = Prisma.sql`(
  0.35 * coalesce(rv.rating, 0) / 5 * least(coalesce(rv.reviews, 0), 5) / 5
  + 0.25 * least(ln(1 + coalesce(dl.deals, 0)) / ln(21), 1)
  + 0.2 * (o."verifiedAt" IS NOT NULL)::int
  + 0.2 * (p."updatedAt" > now() - interval '90 days')::int
)`;

const joins = Prisma.sql`
  JOIN "Organization" o ON o.id = p."organizationId"
  LEFT JOIN LATERAL (
    SELECT avg(r.rating)::float AS rating, count(*)::int AS reviews
    FROM "Review" r WHERE r."targetOrganizationId" = o.id
  ) rv ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS deals
    FROM "Deal" d WHERE d."sellerId" = o.id AND d.status = 'COMPLETED'
  ) dl ON true`;

type Row = { id: string; matched: number; corrected: number };

export async function rankProducts(query: string, limit: number): Promise<SearchOutcome> {
  const parsed = parseQuery(query);
  const scope = queryScope(query, parsed);
  if (scope === "none") return { mode: "exact", ids: [], parsed, corrections: {} };
  if (scope === "all") {
    const rows = await db().$queryRaw<{ id: string }[]>`
      SELECT p.id FROM "Product" p ${joins}
      WHERE p.status = 'PUBLISHED'
      ORDER BY ${quality} DESC, p."updatedAt" DESC, p.id
      LIMIT ${limit}`;
    return { mode: "all", ids: rows.map((r) => r.id), parsed, corrections: {} };
  }

  const corrections = await findCorrections(parsed);
  const strict = await runRanked(parsed, corrections, requiredMatches(parsed.terms.length), limit);
  if (strict.length > 0) {
    const mode = strict.every((r) => r.corrected > 0) ? "typos" : "exact";
    return { mode, ids: strict.map((r) => r.id), parsed, corrections };
  }
  if (parsed.terms.length > 1) {
    const partial = await runRanked(parsed, corrections, 1, limit);
    return { mode: "partial", ids: partial.map((r) => r.id), parsed, corrections };
  }
  return { mode: "exact", ids: [], parsed, corrections };
}

/**
 * Исправления для слов, которых нет ни в одной опубликованной карточке. Словарь — слова
 * из `searchText` опубликованных позиций. Пока каталог небольшой, он собирается на лету;
 * когда позиций станут десятки тысяч, его стоит вынести в отдельную таблицу.
 */
async function findCorrections(parsed: ParsedQuery): Promise<Record<string, string[]>> {
  const candidates = parsed.terms.filter((t) => t.fuzzy);
  if (candidates.length === 0) return {};
  const rows = await db().$queryRaw<{ word: string; fix: string }[]>`
    WITH t AS (
      SELECT * FROM unnest(
        ${candidates.map((c) => c.word)}::text[],
        ${candidates.map((c) => c.tsquery)}::text[],
        ${candidates.map((c) => commonStart(c.word))}::text[]
      ) AS t(word, tsq, prefix)
    ),
    missing AS (
      SELECT t.* FROM t
      WHERE NOT EXISTS (
        SELECT 1 FROM "Product" p
        WHERE p.status = 'PUBLISHED' AND p."searchVector" @@ to_tsquery('russian', t.tsq)
      )
    ),
    words AS (
      SELECT DISTINCT w FROM "Product" p, regexp_split_to_table(p."searchText", ' ') AS w
      WHERE p.status = 'PUBLISHED' AND length(w) >= 4 AND w !~ '[0-9]'
    ),
    -- Основа по словарю PostgreSQL: «ремни» → «ремн», «ремень» → «ремен» (беглая гласная).
    vocab AS (SELECT w, (ts_lexize('russian_stem', w))[1] AS base FROM words),
    stems AS (SELECT missing.*, (ts_lexize('russian_stem', word))[1] AS base FROM missing),
    scored AS (
      SELECT m.word, v.w AS fix,
        row_number() OVER (PARTITION BY m.word ORDER BY levenshtein(m.word, v.w), v.w) AS n
      FROM stems m JOIN vocab v
        ON (
          abs(length(v.w) - length(m.word)) <= 2
          AND levenshtein(m.word, v.w) <= CASE WHEN length(m.word) >= 7 THEN 2 ELSE 1 END
        )
        OR (length(m.base) >= 4 AND levenshtein(m.base, v.base) <= 1)
        OR (m.prefix IS NOT NULL AND left(v.w, length(m.prefix)) = m.prefix)
    )
    SELECT word, fix FROM scored WHERE n <= 3`;
  const result: Record<string, string[]> = {};
  for (const { word, fix } of rows) (result[word] ??= []).push(fix);
  return result;
}

/**
 * Начало слова, по которому ищем однокоренные слова каталога: «гидравлики» → «гидравли»
 * найдёт «гидравлический». Последнюю букву основы отбрасываем из-за чередований (к/ч, г/ж).
 */
function commonStart(word: string): string | null {
  if (word.length < 6) return null;
  const base = stem(word);
  return base.length >= 7 ? base.slice(0, -1) : base;
}

async function runRanked(
  parsed: ParsedQuery,
  corrections: Record<string, string[]>,
  required: number,
  limit: number,
): Promise<Row[]> {
  const like = (code: string) => Prisma.sql`(p."searchText" LIKE ${`%${code}%`})`;
  const terms = parsed.terms.map((term) => {
    const tsquery = Prisma.sql`to_tsquery('russian', ${term.tsquery})`;
    const exact = Prisma.join(
      [Prisma.sql`(p."searchVector" @@ ${tsquery})`, ...term.codes.map(like)],
      " OR ",
    );
    const fixes = corrections[term.word];
    const fixed = fixes?.length
      ? Prisma.sql`(p."searchVector" @@ to_tsquery('russian', ${fixes.join(" | ")}))`
      : Prisma.sql`false`;
    return { tsquery, exact: Prisma.sql`(${exact})`, fixed };
  });

  const zero = Prisma.sql`0`;
  const sum = (parts: Prisma.Sql[]) => (parts.length ? Prisma.join(parts, " + ") : zero);
  const matched = sum(
    terms.map((t) => Prisma.sql`(CASE WHEN ${t.exact} OR ${t.fixed} THEN 1 ELSE 0 END)`),
  );
  const corrected = sum(
    terms.map((t) => Prisma.sql`(CASE WHEN NOT ${t.exact} AND ${t.fixed} THEN 1 ELSE 0 END)`),
  );
  const coverage = sum(
    terms.map(
      (t) => Prisma.sql`(CASE WHEN ${t.exact} THEN 1.0 WHEN ${t.fixed} THEN 0.7 ELSE 0 END)`,
    ),
  );
  const noQuery = Prisma.sql`''::tsquery`;
  const anyQuery = terms.length
    ? Prisma.join(
        terms.map((t) => t.tsquery),
        " || ",
      )
    : noQuery;
  const allQuery = terms.length
    ? Prisma.join(
        terms.map((t) => t.tsquery),
        " && ",
      )
    : noQuery;
  const codeHit = parsed.codes.length
    ? Prisma.sql`(${Prisma.join(parsed.codes.map(like), " OR ")})`
    : Prisma.sql`false`;
  // Если в запросе есть артикул целиком («6206-2RS»), позиция с другим артикулом проходит,
  // только если совпали все слова: «2rs» есть и у 6205-2RS, но это другой подшипник.
  // Совпавший слитно артикул пропускает позицию сам по себе.
  // В запасной выдаче («похожие», required = 1) это правило не действует.
  const need = parsed.codes.length && required > 1 ? Math.max(required, terms.length) : required;
  const needed = terms.length
    ? Prisma.sql`(m.matched >= ${need} OR m.code_hit)`
    : Prisma.sql`m.code_hit`;

  return db().$queryRaw<Row[]>`
    WITH m AS (
      SELECT
        p.id,
        p.price,
        ${matched} AS matched,
        ${corrected} AS corrected,
        ${codeHit} AS code_hit,
        (
          10 * (${coverage})
          + 6 * ${codeHit}::int
          + 3 * (to_tsvector('russian', p.name) @@ (${allQuery}))::int
          + 3 * similarity(lower(p.name), ${parsed.normalized})
          + 4 * ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', coalesce(p."searchVector", ''::tsvector), ${anyQuery}, 32)
          + 2 * ${quality}
        ) AS score
      FROM "Product" p ${joins}
      WHERE p.status = 'PUBLISHED'
    )
    SELECT m.id, m.matched::int AS matched, m.corrected::int AS corrected
    FROM m
    WHERE ${needed}
    ORDER BY m.score DESC, m.price ASC, m.id
    LIMIT ${limit}`;
}
