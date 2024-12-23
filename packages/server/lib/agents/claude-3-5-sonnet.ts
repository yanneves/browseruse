import EventEmitter from "node:events";
import Anthropic from "@anthropic-ai/sdk";
import { chromium, type Browser, type Page } from "playwright";
import sharp from "sharp";
import * as cursors from "../assets/cursors.svg.ts";
import { withCachedPrompts } from "./clause-3-5-sonnet.utils.ts";

type LaunchOptions = {
  session: string;
  replay: string;
};

const MAX_STEPS = 128;

const resolution = {
  browser: { width: 1280, height: 720 },
  agent: { width: 1024, height: 576 },
};

const model = "claude-3-5-sonnet-20241022";
const betas = ["computer-use-2024-10-22", "prompt-caching-2024-07-31"];

const tools: Anthropic.Beta.BetaToolComputerUse20241022[] = [
  {
    type: "computer_20241022",
    name: "computer",
    display_width_px: resolution.agent.width,
    display_height_px: resolution.agent.height,
    cache_control: { type: "ephemeral" },
  },
];

const system = `
You are a website quality assurance agent role playing a typical user. The user has instructed you to evaluate the usability and accessibility of a website. Your objective is not to act on behalf of the user, e.g. to find information, but to evaluate your experience completing an objective.

Use a mouse and keyboard to interact with a browser, and take screenshots.
* This is an interface to a browser application. You do not have access to the address bar or search. You must stay within the browser viewport.
* Some websites may take time to load or process actions, so you may need to wait and take successive screenshots to see the results of your actions. E.g. if you click on a button and nothing happens, try taking another screenshot.
* Some websites may have more information 'below the fold', try scrolling with Page_Up / Page_Down and taking another screenshot.
* The screen's resolution is {{ display_width_px }}x{{ display_height_px }}.

Mouse Cursor Position Validation:
* Before any click action, take a screenshot and verify:
    1. The cursor tip is visible in the screenshot
    2. The intended target element is clearly visible
    3. The cursor tip falls within the boundaries of the target element
    4. The cursor is not obscured by any overlays or tooltips
* If the cursor position appears incorrect:
    1. Take note of the element's visual boundaries
    2. Adjust the cursor position to the center of the element
    3. Take a new screenshot to confirm correct positioning
    4. Only proceed with the click if the position is verified
* For small or precise targets:
    1. Zoom in if necessary to ensure accurate positioning
    2. Aim for the center of clickable elements
    3. Avoid clicking on edges or borders
* If multiple attempts to position the cursor fail:
    1. Document the attempted positions
    2. Try alternative methods (tab navigation, keyboard shortcuts)
    3. Note this as a potential accessibility issue

Validation Process:
1. After each action, take a new screenshot
2. Verify the expected outcome occurred
3. Record any unexpected behaviors or failures
4. Document the steps taken to correct positioning issues
5. Only proceed when the current step is confirmed successful

Communication Guidelines:
* Use natural language appropriate for user testing
* Avoid technical terms like "screenshot", "coordinates", "Page_Up", "Page_Down"
* Instead use terms like:
    - "look at" instead of "screenshot"
    - "location" instead of "coordinates"
    - "scroll" instead of "Page_Up/Down"
* Explain your observations and reasoning in simple terms

Task Completion:
* If task is successfully completed, end with \<complete>
* If task cannot be completed despite multiple attempts, end with \<quit>
* Include a brief summary of any persistent cursor positioning issues encountered

If required to enter an email address use "agent@email.gadabout.ai", unless another is provided in the user prompt.
`;

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class Agent extends EventEmitter {
  private _session: string = "";
  private _replay: string = "";
  private _aborted = false;

  private _cursorPositionX = -1;
  private _cursorPositionY = -1;

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

  cursor([x, y]: [number, number] | number[] = []) {
    if (Number.isFinite(x)) {
      this._cursorPositionX =
        x * (resolution.browser.width / resolution.agent.width);
    }

    if (Number.isFinite(y)) {
      this._cursorPositionY =
        y * (resolution.browser.height / resolution.agent.height);
    }

    return [this._cursorPositionX, this._cursorPositionY];
  }

  async screenshot(page: Page) {
    const screen = await page.screenshot({ caret: "initial" });
    const buffer = await sharp(screen)
      .resize(resolution.agent.width, resolution.agent.height)
      .toBuffer();

    const screenshot = buffer.toString("base64");
    this.dispatch("render", screenshot);

    return screenshot;
  }

  async loop(page: Page, prompt: string): Promise<void> {
    // TODO: build a smarter delay / wait logic that checks for abort command
    await delay(2000);

    if (this._aborted) {
      console.info("Launch aborted");
      return;
    }

    const screenshot = await this.screenshot(page);

    const messages: Anthropic.Beta.BetaMessageParam[] = [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: screenshot,
            },
          },
          { type: "text", text: "Screenshot of the landing page." },
          { type: "text", text: prompt },
        ],
      },
    ];

    return this.step(page, messages);
  }

  async step(
    page: Page,
    messages: Anthropic.Beta.BetaMessageParam[] = [],
    count = 1,
  ): Promise<void> {
    let terminate = false;

    if (count > MAX_STEPS) {
      const message = `Exceeded maximum number of steps [${MAX_STEPS}]`;

      console.info(`${message}\n`);
      this.dispatch("agent", { status: "exhausted", thoughts: message });
      return;
    }

    const completion = await ai.beta.messages.create({
      model,
      betas,
      tools,
      system,
      max_tokens: 5120,
      temperature: 1.0,
      messages: withCachedPrompts(messages),
    });

    console.log(JSON.stringify(completion, null, 2));

    if (completion.usage) {
      const tokens =
        completion.usage.input_tokens + completion.usage.output_tokens;

      const cacheTokens =
        (completion.usage.cache_creation_input_tokens || 0) +
        (completion.usage.cache_read_input_tokens || 0);

      const cost =
        completion.usage.input_tokens * (300 / 1000000) +
        completion.usage.output_tokens * (1500 / 1000000) +
        (completion.usage.cache_creation_input_tokens || 0) * (375 / 1000000) +
        (completion.usage.cache_read_input_tokens || 0) * (30 / 1000000);

      console.info(
        `Tokens used: ${tokens} i/o (${cacheTokens} r/w) ~${cost.toFixed(3)}¢\n`,
      );
    }

    if (this._aborted) {
      console.warn("Launch aborted mid-flight");
      return;
    }

    if (completion.stop_reason !== "tool_use") {
      const [res] = completion.content;

      let thoughts: string | undefined;
      if (res?.type === "text") {
        thoughts = res.text;
      }

      let status = "exhausted";
      if (thoughts?.includes("<complete>")) {
        status = "complete";
      } else if (thoughts?.includes("<quit>")) {
        status = "quit";
      }

      this.dispatch("agent", { status, thoughts });
      return;
    }

    const content: Anthropic.Beta.BetaContentBlockParam[] = [];

    try {
      await Promise.all(
        completion.content.map(async (res) => {
          if (res.type == "text") {
            const { text } = res;

            let status = "live";
            if (text.includes("<complete>")) {
              status = "complete";
            } else if (text.includes("<quit>")) {
              status = "quit";
            }

            if (status !== "live") {
              // TODO: this is too spaghetti
              terminate = true;
            }

            this.dispatch("agent", { status, thoughts: text });
          }

          if (res.type == "tool_use") {
            type ComputerToolUseBlockInput = {
              action: string;
              coordinate?: number[];
              text?: string;
            };

            const input = res.input as ComputerToolUseBlockInput;

            switch (input.action) {
              // `screenshot`: Take a screenshot of the screen.
              case "screenshot": {
                const screenshot = await this.screenshot(page);

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                  content: [
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: "image/png",
                        data: screenshot,
                      },
                    },
                  ],
                });

                break;
              }

              // `key`: Press a key or key-combination on the keyboard.
              //   - This supports xdotool's `key` syntax.
              //   - Examples: "a", "Return", "alt+Tab", "ctrl+s", "Up", "KP_0" (for the numpad 0 key).
              case "key": {
                if (!input.text) {
                  break;
                }

                let key = input.text;

                // TODO: abstract this in a more extensive lookup library
                const lookup = [
                  ["Space", " "],
                  ["Tab", "Tab"],
                  ["Escape", "Escape"],
                  ["Enter", "Enter"],
                  ["Return", "Enter"],
                  ["Linefeed", "Enter"],
                  ["BackSpace", "Backspace"],
                  ["Clear", "Clear"],
                  ["Delete", "Delete"],
                  ["Page_Up", "PageUp"],
                  ["Page_Down", "PageDown"],
                  ["End", "End"],
                  ["Home", "Home"],
                  ["Up", "ArrowUp"],
                  ["Right", "ArrowRight"],
                  ["Down", "ArrowDown"],
                  ["Left", "ArrowLeft"],
                ];

                lookup.every(([xkey, uikey]) => {
                  if (key.includes(xkey)) {
                    key = uikey;
                    return false;
                  }

                  return true;
                });

                try {
                  await page.keyboard.press(key);
                  await page.waitForLoadState("domcontentloaded");
                  await this.screenshot(page);

                  content.push({ type: "tool_result", tool_use_id: res.id });
                } catch {
                  const err = `Unsuccessful key press using "${key}"`;
                  console.error(err);
                  content.push({
                    type: "tool_result",
                    tool_use_id: res.id,
                    content: err,
                    is_error: true,
                  });
                }

                break;
              }

              // `type`: Type a string of text on the keyboard.
              case "type": {
                if (!input.text) {
                  break;
                }

                await page.keyboard.type(input.text, { delay: 80 });
                await this.screenshot(page);

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                });

                break;
              }

              // `mouse_move`: Move the cursor to a specified (x, y) pixel coordinate on the screen.
              case "mouse_move": {
                if (!input.coordinate) {
                  break;
                }

                const [x, y] = this.cursor(input.coordinate);

                const interactive = await page
                  .getByRole("link", { disabled: false })
                  .or(page.getByRole("button", { disabled: false }))
                  .or(page.getByRole("checkbox", { disabled: false }))
                  .or(page.getByRole("combobox", { disabled: false }))
                  .all();

                const locators = await Promise.all(
                  interactive.map(async (locator) => ({
                    locator,
                    rect: await locator.boundingBox(),
                  })),
                );

                const hoverable =
                  locators.findIndex(({ rect }) => {
                    if (!rect?.y || !rect?.x || !rect?.height || !rect?.width) {
                      return false;
                    }

                    const left = rect.x;
                    const right = rect.x + rect.width;

                    const top = rect.y;
                    const bottom = rect.y + rect.height;

                    return x >= left && x <= right && y >= top && y <= bottom;
                  }) > -1;

                await page.evaluate(
                  ({ cursors, x, y, hoverable }) => {
                    const id = "gadabout-cursor";
                    const cursor =
                      document.getElementById(id) ||
                      document.createElement("aside");
                    cursor.id = id;
                    cursor.setAttribute(
                      "style",
                      `pointer-events: none; position: absolute; z-index: 99999999; left: ${x}px; top: ${y}px;`,
                    );
                    cursor.innerHTML = hoverable ? cursors.hand : cursors.arrow;
                    document.body.appendChild(cursor);
                  },
                  { cursors, x, y, hoverable },
                );

                await page.mouse.move(x, y);
                await this.screenshot(page);

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                });

                break;
              }

              // `left_click`: Click the left mouse button.
              case "left_click":
              // `right_click`: Click the right mouse button.
              case "right_click":
              // `middle_click`: Click the middle mouse button.
              case "middle_click":
              // `double_click`: Double-click the left mouse button.
              case "double_click": {
                let button: "left" | "right" | "middle" = "left";
                if (input.action === "right_click") {
                  button = "right";
                } else if (input.action === "middle_click") {
                  button = "middle";
                }

                await page.mouse.down({ button });
                await page.mouse.up({ button });

                if (input.action === "double_click") {
                  await page.mouse.down({ button });
                  await page.mouse.up({ button });
                }

                await page.waitForLoadState("domcontentloaded");

                await delay(2000);
                await this.screenshot(page);

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                });

                break;
              }

              // `left_click_drag`: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
              case "left_click_drag": {
                if (!input.coordinate) {
                  break;
                }

                const [x, y] = this.cursor(input.coordinate);

                await page.mouse.down();
                // Move the cursor twice to more reliable trigger dragover event where applicable
                await page.mouse.move(
                  x * Math.random() * 0.2 + 0.9,
                  y * Math.random() * 0.2 + 0.9,
                );
                await page.mouse.move(x, y);
                await page.mouse.up();
                await page.waitForLoadState("domcontentloaded");
                await this.screenshot(page);

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                });

                break;
              }

              // `cursor_position`: Get the current (x, y) pixel coordinate of the cursor on the screen.
              case "cursor_position": {
                const [x, y] = this.cursor();

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                  content: [{ type: "text", text: `(${x}, ${y})` }],
                });

                break;
              }

              // no match
              default: {
                const message = `Action "${input.action}" not currently supported.`;

                content.push({
                  type: "tool_result",
                  tool_use_id: res.id,
                  is_error: true,
                  content: [{ type: "text", text: message }],
                });

                console.error(message);
                break;
              }
            }
          }
        }),
      );

      if (!content.length) {
        return;
      }

      // Reflect assistant output
      messages.push({
        role: "assistant",
        content: completion.content,
      });

      messages.push({ role: "user", content });
    } catch (err) {
      console.error(err);
      return;
    }

    if (terminate) {
      return;
    }

    return this.step(page, messages, count + 1);
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

    let browser: Browser;
    if (process.env.BROWSER_WS_URL) {
      browser = await chromium.connect(process.env.BROWSER_WS_URL);
    } else {
      browser = await chromium.launch();
    }

    const context = await browser.newContext({
      viewport: {
        width: resolution.browser.width,
        height: resolution.browser.height,
      },
      geolocation: { latitude: 51.509865, longitude: -0.118092 }, // London, UK
      permissions: ["geolocation"],
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await this.loop(page, prompt);

    await context.close();
    await browser.close();
  }

  async abort() {
    this._aborted = true;
  }
}
