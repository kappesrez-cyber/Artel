import { describe, expect, it } from "vitest";
import { availableDealActions, nextDealStatus } from "./transitions";

describe("ход сделки", () => {
  it("продавец принимает, покупатель завершает", () => {
    expect(nextDealStatus("REQUESTED", "seller", "accept")).toBe("ACCEPTED");
    expect(nextDealStatus("ACCEPTED", "buyer", "complete")).toBe("COMPLETED");
  });

  it("покупатель не может принять сделку за продавца, продавец — завершить её", () => {
    expect(nextDealStatus("REQUESTED", "buyer", "accept")).toBeNull();
    expect(nextDealStatus("ACCEPTED", "seller", "complete")).toBeNull();
  });

  it("нельзя завершить непринятую сделку", () => {
    expect(nextDealStatus("REQUESTED", "buyer", "complete")).toBeNull();
  });

  it("отменить можно до завершения, закрытую — нельзя", () => {
    expect(nextDealStatus("REQUESTED", "buyer", "cancel")).toBe("CANCELLED");
    expect(nextDealStatus("ACCEPTED", "seller", "cancel")).toBe("CANCELLED");
    expect(nextDealStatus("COMPLETED", "buyer", "cancel")).toBeNull();
    expect(nextDealStatus("CANCELLED", "seller", "cancel")).toBeNull();
  });

  it("кнопки для каждой стороны", () => {
    expect(availableDealActions("REQUESTED", "seller")).toEqual(["accept", "cancel"]);
    expect(availableDealActions("REQUESTED", "buyer")).toEqual(["cancel"]);
    expect(availableDealActions("ACCEPTED", "buyer")).toEqual(["complete", "cancel"]);
    expect(availableDealActions("COMPLETED", "seller")).toEqual([]);
  });
});
