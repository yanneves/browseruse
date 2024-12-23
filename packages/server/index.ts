import { v7 as uuidv7 } from "uuid";
import { WebSocketServer } from "ws";
import Agent from "./lib/agent.ts";
import db from "./lib/database.ts";

const { PORT = 8080 } = process.env;

const server = new WebSocketServer({ port: +PORT });

server.on("connection", (stream) => {
  const agent = new Agent();

  stream.on("error", console.error);

  stream.on("message", async (message) => {
    try {
      const { type, payload } = JSON.parse(message.toString());

      switch (type) {
        case "launch":
          const { session, prompt, url } = payload;
          const replay = uuidv7();

          const res = await db.query(
            `
              SELECT balance
              FROM accounts
              WHERE id = $1::uuid;
            `,
            [session],
          );

          const [account] = res.rows;
          if (account.balance <= 0) {
            console.warn("Insufficient balance to launch prompt");
            break;
          }

          // Create replay session in database to add events to
          await db.query(
            `
              INSERT INTO replays (id, account, prompt, url)
              VALUES($1::uuid, $2::uuid, $3::text, $4::text);
            `,
            [replay, session, prompt, url],
          );

          console.info(
            "Launch command received: ",
            JSON.stringify({ prompt, url }, null, 2),
          );

          agent.launch(prompt, url, { session, replay });
          break;

        case "abort":
          agent.abort();
          break;

        default:
          console.error(`Received unhandled message type: ${type}`);
      }
    } catch (err) {
      console.error(`Unable to parse ${message}: ${err}`);
    }
  });

  agent.on("agent", async ({ meta, data }) => {
    let balance = 0;

    try {
      // Subtract credit from account balance
      const res = await db.query(
        `
          UPDATE accounts
          SET balance = GREATEST(balance - 1, 0)
          WHERE id = $1::uuid
          RETURNING balance;
        `,
        [meta.session],
      );

      const [account] = res.rows;
      balance = account.balance;
    } catch (err) {
      console.error("Error updating account balance: ", err);
    }

    const payload = { meta: { balance }, data };
    const message = { type: "agent", payload };

    stream.send(JSON.stringify(message));

    try {
      // Save event to replay session
      await db.query(
        `
          INSERT INTO replays_events (id, replay, payload)
          VALUES ($1::uuid, $2::uuid, $3::jsonb);
        `,
        [uuidv7(), meta.replay, message],
      );
    } catch (err) {
      console.error("Error saving replay event: ", err);
    }
  });

  agent.on("render", async ({ meta, data }) => {
    const message = { type: "render", payload: data };

    stream.send(JSON.stringify(message));

    try {
      // Save event to replay session
      await db.query(
        `
          INSERT INTO replays_events (id, replay, payload)
          VALUES ($1::uuid, $2::uuid, $3::jsonb);
        `,
        [uuidv7(), meta.replay, message],
      );
    } catch (err) {
      console.error("Error saving replay event: ", err);
    }
  });
});
