import { describe, expect, it } from "vitest";
import { plural } from "./labels";

describe("plural", () => {
  it.each([
    [1, "1 сделка"],
    [2, "2 сделки"],
    [5, "5 сделок"],
    [11, "11 сделок"],
    [21, "21 сделка"],
    [104, "104 сделки"],
    [112, "112 сделок"],
  ])("%i", (n, expected) => {
    expect(plural(n, "сделка", "сделки", "сделок")).toBe(expected);
  });
});
