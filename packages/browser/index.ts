import { chromium } from "playwright";

const browserServer = await chromium.launchServer({
  channel: "chromium",
  port: +(process.env.PORT || 0),
  wsPath: process.env.PATHNAME || undefined,
  logger: {
    isEnabled: (name) => name === "api",
    log: (name, severity, message) =>
      console.log(`${name}[${severity}] ${message}`),
  },
});

console.info("\nBrowser server launched:", browserServer.wsEndpoint());
