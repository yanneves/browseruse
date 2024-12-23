import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, test as it } from "vitest";
import { withCachedPrompts } from "./clause-3-5-sonnet.utils.ts";

describe("withCachedPrompts()", () => {
  it("should modify the last user message with an array content", () => {
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "assistant", content: [{ type: "text", text: "Message 1" }] },
      { role: "user", content: [{ type: "text", text: "Message 2" }] },
      { role: "user", content: [{ type: "text", text: "Message 3" }] },
    ];

    const result = withCachedPrompts(messages);

    console.log(JSON.stringify(result, null, 2));

    expect(result[2].content[0]).toHaveProperty("cache_control", {
      type: "ephemeral",
    });
  });

  it("should only modify the last three user messages with array content", () => {
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: [{ type: "text", text: "Message 1" }] },
      { role: "user", content: [{ type: "text", text: "Message 2" }] },
      { role: "user", content: [{ type: "text", text: "Message 3" }] },
      { role: "user", content: [{ type: "text", text: "Message 4" }] },
      { role: "assistant", content: [{ type: "text", text: "Message 5" }] },
    ];

    const result = withCachedPrompts(messages);

    expect(result[0].content[0]).not.toHaveProperty("cache_control");
    expect(result[1].content[0]).toHaveProperty("cache_control", {
      type: "ephemeral",
    });
    expect(result[2].content[0]).toHaveProperty("cache_control", {
      type: "ephemeral",
    });
    expect(result[3].content[0]).toHaveProperty("cache_control", {
      type: "ephemeral",
    });
    expect(result[4].content[0]).not.toHaveProperty("cache_control");
  });

  it("should ignore messages with non-array content", () => {
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: "Single Message" },
      { role: "user", content: [{ type: "text", text: "Message Array 1" }] },
    ];

    const result = withCachedPrompts(messages);

    expect(result[1].content[0]).toHaveProperty("cache_control", {
      type: "ephemeral",
    });
    expect(result[0]).toHaveProperty("content", "Single Message");
  });

  it("should return a copy of the messages array without modifying the original", () => {
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: [{ type: "text", text: "Message 1" }] },
      { role: "assistant", content: [{ type: "text", text: "Message 2" }] },
    ];

    const originalCopy = structuredClone(messages);
    const result = withCachedPrompts(messages);

    expect(result).not.toBe(messages);
    expect(messages).toEqual(originalCopy);
  });

  it("should handle an empty array gracefully", () => {
    const messages: Anthropic.Beta.BetaMessageParam[] = [];

    const result = withCachedPrompts(messages);

    expect(result).toEqual([]);
  });
});
