import type Anthropic from "@anthropic-ai/sdk";

export const withCachedPrompts = (
  messages: Anthropic.Beta.BetaMessageParam[],
) => {
  const arr = structuredClone(messages);

  let breakpointsAvailable = 3;
  arr.toReversed().every((message, i) => {
    if (breakpointsAvailable <= 0) {
      return false;
    }

    if (message.role === "user" && Array.isArray(message.content)) {
      const index = arr.length - 1 - i;

      (
        arr[index].content.at(-1) as Anthropic.Beta.BetaContentBlockParam
      ).cache_control = { type: "ephemeral" };

      breakpointsAvailable--;
    }

    return true;
  });

  return arr;
};
