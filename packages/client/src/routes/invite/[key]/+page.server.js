import { error, redirect } from "@sveltejs/kit";
import { DATABASE_URL } from "$env/static/private";
import pg from "pg";
import { v7 as uuidv7 } from "uuid";

export const load = async ({ params, cookies }) => {
  const { key } = params;

  // Check invite key is in expected format
  if (!/^\w+-\w+-\w+$/.test(key)) {
    console.warn("Invite queried with invalid key: ", key);
    throw redirect(307, "/invite/invalid");
  }

  // Connect database and begin transaction
  const client = new pg.Client(DATABASE_URL);
  await client.connect();
  await client.query("BEGIN");

  let res;
  try {
    res = await client.query(
      `
        SELECT id, account
        FROM invites
        WHERE id = $1::text
        FOR UPDATE;
      `,
      [key],
    );
  } catch (err) {
    await client.query("ROLLBACK");
    await client.end();

    console.error("Error querying database: ", err);
    throw error(500, "Error locating invite");
  }

  const [invite] = res.rows;

  if (!invite) {
    console.warn("Invite queried with unregistered key: ", key);
    throw redirect(307, "/invite/invalid");
  }

  // If no account already exists, create a new one
  if (invite.account === null) {
    const id = uuidv7();
    invite.account = id;

    try {
      await client.query(
        `
          INSERT INTO accounts (id, balance)
          VALUES ($1::uuid, 100);
        `,
        [id],
      );

      await client.query(
        `
          UPDATE invites
          SET account = $2::uuid
          WHERE id = $1::text AND account IS NULL;
        `,
        [key, id],
      );
    } catch (err) {
      await client.query("ROLLBACK");
      await client.end();

      console.error("Error querying database: ", err);
      throw error(500, "Error processing invite");
    }
  }

  // End transaction and disconnect database
  await client.query("COMMIT");
  await client.end();

  cookies.set("session", invite.account, { path: "/" });
};
