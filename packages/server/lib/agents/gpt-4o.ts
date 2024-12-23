import EventEmitter from "node:events";
import OpenAI from "openai";
import { zodFunction } from "openai/helpers/zod";
import { chromium, type Locator, type Page } from "playwright";
import { z } from "zod";

type LaunchOptions = {
  session: string;
  replay: string;
};

const MAX_STEPS = 15;

const model = "gpt-4o";

const thoughts = z
  .string()
  .describe("Your first-person thoughts connected to the action");

const tools = [
  zodFunction({
    name: "complete",
    description: "Mark the objective as completed",
    parameters: z.object({ thoughts }),
  }),
  zodFunction({
    name: "quit",
    description:
      "Give up attempting the objective, don't hesitate to do this if you're stuck",
    parameters: z.object({ thoughts }),
  }),
  zodFunction({
    name: "type",
    description: "Type into an element at x,y coordinates on the page shown",
    parameters: z.object({
      thoughts,
      input: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  }),
  zodFunction({
    name: "click",
    description: "Click an element at x,y coordinates on the page shown",
    parameters: z.object({
      thoughts,
      x: z.number(),
      y: z.number(),
    }),
  }),
  zodFunction({
    name: "scroll",
    description: "Scroll the page vertically",
    parameters: z.object({ thoughts, y: z.number() }),
  }),
];

const SYSTEM_PROMPT = `
You are a website quality assurance agent role playing a pedestrian user.

The user will present you with the screenshot of a browser page. The resolution of the screenshot is 1024 x 576 pixels.

You only have the provided tools to interact with the page. Think extra carefully about any coordinates you supply as you don't have the best accuracy sometimes. Never reuse the same coordinates for consecutive actions.

Never mention technical terminology like "screenshot" or "coordinates". Substitute these words with simple terminology like "what I can see" or "location".

If required to enter an email address use "agent@email.gadabout.ai", unless another is provided in the user prompt.

Do not type a response. Instead, you must always call an action using the provided tools. You will take one action at a time towards your goal. Failure to call a tool will cause bad things to happen.

Otherwise ask forgiveness not permission.
`;

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class Agent extends EventEmitter {
  private _session: string = "";
  private _replay: string = "";
  private _aborted = false;

  constructor() {
    super();
  }

  dispatch(type: string, data: string | object) {
    this.emit(type, {
      data,
      meta: {
        session: this._session,
        replay: this._replay,
      },
    });
  }

  async step(
    page: Page,
    prompt: string,
    num = 1,
    previous: {
      screenshot: string;
      thoughts: string[];
    } | null = null,
  ): Promise<void> {
    // TODO: build a smarter delay / wait logic that checks for abort command
    await delay(2000);

    if (this._aborted) {
      console.info("Launch aborted");
      return;
    }

    const buffer = await page.screenshot();
    const screenshot = buffer.toString("base64");

    this.dispatch("render", screenshot);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    messages.push({ role: "system", content: SYSTEM_PROMPT });

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    // if (previous?.screenshot) {
    //   content.push({
    //     type: "text",
    //     text: "Previous screen for reference: (note if this is unchanged from the current screen below, your previous step contained an error)",
    //   });
    //   content.push({
    //     type: "image_url",
    //     image_url: {
    //       url: `data:image/png;base64,${previous.screenshot}`,
    //       detail: "high",
    //     },
    //   });
    // }

    // content.push({ type: "text", text: "Current screen:" });
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${screenshot}`,
        detail: "high",
      },
    });

    content.push({ type: "text", text: prompt });

    messages.push({ role: "user", content });

    if (previous?.thoughts) {
      const list = previous.thoughts.reduce(
        (memo, thought, i) => `${memo}${i + 1}. ${thought}\n`,
        "",
      );

      messages.push({
        role: "assistant",
        content: `Steps I have taken so far:\n\n${list}`,
      });

      messages.push({
        role: "user",
        content:
          "Call complete if goal is satisfied, otherwise keep going. I'm not sure if your previous action was to click or type but try some new coordinates if that hasn't worked.",
      });
    }

    const completion = await ai.chat.completions.create({
      // TODO: set temperature?
      // temperature: 0.1,
      model,
      tools,
      messages,
    });

    if (completion.usage) {
      console.info(
        `Step completed using ${completion.usage.total_tokens} tokens\n`,
      );
    }

    if (this._aborted) {
      console.warn("Launch aborted mid-flight");
      return;
    }

    let thoughts = "";
    try {
      const action = completion.choices[0].message.tool_calls?.[0];

      if (!action) {
        console.error(completion.choices[0].message);
        throw new Error("No action provided");
      }

      const { name } = action.function;
      const args = JSON.parse(action.function.arguments);

      thoughts = args.thoughts;

      if (name === "complete") {
        console.info("Success!\n");
        this.dispatch("agent", { status: "complete", thoughts });
        return;
      } else if (name === "quit") {
        console.info("Retired!\n");
        this.dispatch("agent", { status: "quit", thoughts });
        return;
      } else if (num >= MAX_STEPS) {
        const message = `Exceeded maximum number of steps [${MAX_STEPS}]`;

        console.info(`${message}\n`);
        this.dispatch("agent", { status: "live", thoughts });
        this.dispatch("agent", { status: "exhausted", thoughts: message });
        return;
      } else {
        this.dispatch("agent", { status: "live", thoughts });
      }

      if (name === "scroll") {
        thoughts += ` scroll({ y: ${args.y} })`;
        await page.mouse.wheel(0, args.y);
        await delay(3000);
      }

      if (name === "click" || name === "type") {
        console.info("Spatial command received:");

        const width = page.viewportSize()?.width ?? 0;
        const height = page.viewportSize()?.height ?? 0;

        let interactive: Locator[] = [];
        if (name === "click") {
          // Previous clickable selectors
          // "[href]",
          // "input",
          // "button",
          // "select",
          // "details",
          // "summary",
          // '[tabindex]:not([tabindex="-1"])',

          thoughts += ` click({ x: ~${args.x}, y: ~${args.y} })`;
          console.info(`click({ x: ${args.x}, y: ${args.y} })\n`);

          interactive = await page
            .getByRole("link", { disabled: false })
            .or(page.getByRole("button", { disabled: false }))
            .or(page.getByRole("checkbox", { disabled: false }))
            .or(page.getByRole("combobox", { disabled: false }))
            .all();
        } else if (name === "type") {
          // Previous typeable selectors
          // "input",
          // "textarea",
          // "[contenteditable]",

          thoughts += ` type({ input: ${args.input}, x: ~${args.x}, y: ~${args.y} })`;
          console.info(
            `type({ input: ${args.input}, x: ${args.x}, y: ${args.y} })\n`,
          );

          interactive = await page
            .getByRole("textbox", { disabled: false })
            .or(page.getByRole("searchbox", { disabled: false }))
            .all();
        }

        const locators = await Promise.all(
          interactive.map(async (locator) => ({
            locator,
            rect: await locator.boundingBox(),
          })),
        );

        const closest = locators.reduce<{
          locator: Locator;
          x: number;
          y: number;
          distance: number;
        } | null>((memo, { rect, locator }) => {
          if (
            (rect?.x || rect?.y || rect?.width || rect?.height) &&
            rect.x >= -rect.height &&
            rect.x >= -rect.width &&
            rect.y <= height &&
            rect.x <= width
          ) {
            // Element is visible in viewport
            const centre = {
              x: (rect.x + rect.x + rect.width) / 2,
              y: (rect.y + rect.y + rect.height) / 2,
            };

            const distanceEuclidian = Math.sqrt(
              Math.pow(args.x - centre.x, 2) + Math.pow(args.y - centre.y, 2),
            );

            if (!memo || distanceEuclidian < memo.distance) {
              return {
                locator,
                x: centre.x,
                y: centre.y,
                distance: distanceEuclidian,
              };
            }
          }

          return memo;
        }, null);

        if (!closest) {
          throw new Error(`No available locator exists to ${name}`);
        } else if (name === "click") {
          await page.mouse.click(closest.x, closest.y);
          await page.waitForLoadState("domcontentloaded");
        } else if (name === "type") {
          await closest.locator.pressSequentially(args.input, { delay: 80 });
        }
      }
    } catch (err) {
      console.error(`Failed to parse action: ${err}`);
      return;
    }

    return this.step(page, prompt, num + 1, {
      screenshot,
      thoughts: [...(previous?.thoughts ?? []), thoughts],
    });
  }

  async launch(
    prompt: string,
    url: string,
    { session, replay }: LaunchOptions,
  ) {
    // TODO: move session and replay to constructor
    this._session = session;
    this._replay = replay;
    this._aborted = false;

    const browser = await chromium.launch();

    const context = await browser.newContext({
      viewport: { width: 1024, height: 576 },
      geolocation: { latitude: 51.509865, longitude: -0.118092 }, // London, UK
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await this.step(page, prompt);

    await context.close();
    await browser.close();
  }

  async abort() {
    this._aborted = true;
  }
}
