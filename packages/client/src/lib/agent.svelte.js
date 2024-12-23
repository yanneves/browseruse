import { PUBLIC_WS_ENDPOINT } from "$env/static/public";
import { WebSocket } from "partysocket";
import account from "./stores/account.svelte.js";
import browser from "./stores/browser.svelte.js";
import feed from "./stores/feed.svelte.js";

const socket = new WebSocket(PUBLIC_WS_ENDPOINT);

const sendAction = (type, payload) => {
  socket.send(JSON.stringify({ type, payload }));
};

const metaHandler = (type, payload) => {
  switch (type) {
    case "agent": {
      account.balance = payload.meta.balance;
      break;
    }
    default:
      break;
  }
};

let thinkingTimeout;
const dataHandler = (type, payload) => {
  switch (type) {
    case "agent": {
      const { status, thoughts } = payload.data || {};

      clearTimeout(thinkingTimeout);
      if (status === "live") {
        thinkingTimeout = setTimeout(() => (feed.status = "thinking"), 2000);
      } else if (status !== "live") {
        // TODO: this is a bit awkward, find another way
        thinkingTimeout = setTimeout(() => (feed.status = "idle"), 300);
      }

      feed.status = status;
      feed.thoughts.unshift({ status, message: thoughts });

      break;
    }
    case "render": {
      browser.render = `data:image/png;base64,${payload}`;
      break;
    }
    default:
      break;
  }
};

socket.onmessage = (message) => {
  try {
    const { type, payload } = JSON.parse(message.data);
    metaHandler(type, payload);
    dataHandler(type, payload);
  } catch (err) {
    console.error("WebSocket parser error: ", err);
  }
};

socket.onerror = ({ error }) => console.error("WebSocket error: ", error);

// socket.onopen = () => {};

export function launch(session, prompt, url) {
  feed.reset();
  browser.reset();

  sendAction("launch", { session, prompt, url });
}

export function abort(session) {
  clearTimeout(thinkingTimeout);
  feed.status = "idle";

  sendAction("abort", { session });
}
