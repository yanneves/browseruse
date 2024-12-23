import { describe, expect, expectTypeOf, test as it } from "vitest";
import moniker from "./index.ts";

describe("moniker", () => {
  it("should return an array", () => {
    expectTypeOf(moniker()).toBeArray();
  });

  it("should return all results as single words", () => {
    moniker().forEach((word) => expect(word).toMatch(/\w/));
  });

  it("should return all results in lower case alpha characters", () => {
    moniker().forEach((word) => expect(word).toMatch(/[a-z]+/));
  });

  it("should accept numeric argument for size of array returned", () => {
    expect(moniker(5)).toHaveLength(5);
  });
});
