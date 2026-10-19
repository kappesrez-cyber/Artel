import { describe, expect, it } from "vitest";
import { assess, type CompanyFacts } from "./assess";

const now = new Date("2026-10-19T12:00:00Z");
const solid: CompanyFacts = {
  isSeller: true,
  foundedYear: 1998,
  verified: true,
  financialYears: [2019, 2020, 2021, 2022, 2023, 2024, 2025],
  certificates: 4,
  completedDeals: 58,
  cancelledDeals: 1,
  totalDeals: 59,
  reviewsCount: 58,
  averageRating: 4.9,
  products: 3,
  productsWithAnalogs: 3,
};

describe("ИИ-сводка", () => {
  it("долгая история, отчётность и сделки — надёжный производитель", () => {
    const a = assess(solid, {}, now);
    expect(a.verdict).toBe("Надёжный производитель");
    expect(a.tone).toBe("RELIABLE");
    expect(a.points.map((p) => p.text)).toContain(
      "Финансовая отчётность с 2019 года загружена и проверена",
    );
    expect(a.points.map((p) => p.text)).toContain("Более 58 успешных сделок на платформе");
  });

  it("признак перекупа из внешней проверки решает итог", () => {
    const a = assess(
      solid,
      { flags: ["reseller"], facts: [{ kind: "bad", text: "Нет цеха" }] },
      now,
    );
    expect(a.verdict).toBe("Перекуп-пустышка");
    expect(a.tone).toBe("RISK");
    expect(a.points.at(-1)).toEqual({ kind: "bad", text: "Нет цеха", source: "external" });
  });

  it("сорванные сделки и плохие отзывы — высокий риск", () => {
    const a = assess(
      {
        ...solid,
        completedDeals: 3,
        cancelledDeals: 4,
        totalDeals: 7,
        reviewsCount: 3,
        averageRating: 2.3,
      },
      {},
      now,
    );
    expect(a.verdict).toBe("Высокий риск");
  });

  it("без данных — «мало данных», а не риск", () => {
    const a = assess(
      {
        ...solid,
        foundedYear: null,
        verified: false,
        financialYears: [],
        certificates: 0,
        completedDeals: 0,
        cancelledDeals: 0,
        totalDeals: 0,
        reviewsCount: 0,
        averageRating: null,
        products: 0,
        productsWithAnalogs: 0,
      },
      {},
      now,
    );
    expect(a.verdict).toBe("Мало данных");
    expect(a.tone).toBe("CAUTION");
  });

  it("молодая компания без нареканий — перспективная", () => {
    const a = assess(
      {
        ...solid,
        foundedYear: 2024,
        financialYears: [2024, 2025],
        completedDeals: 7,
        totalDeals: 7,
        cancelledDeals: 0,
        reviewsCount: 7,
        averageRating: 5,
      },
      {},
      now,
    );
    expect(a.verdict).toBe("Молодой и перспективный");
  });

  it("у заказчика итог про заказчика", () => {
    expect(assess({ ...solid, isSeller: false }, {}, now).verdict).toBe("Надёжный заказчик");
  });
});
