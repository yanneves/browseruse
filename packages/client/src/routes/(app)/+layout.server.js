import { redirect } from "@sveltejs/kit";
import { DATABASE_URL } from "$env/static/private";
import pg from "pg";

export const load = async ({ cookies }) => {
  const session = cookies.get("session");

  if (!session) {
    console.warn("Encountered invalid session");
    throw redirect(307, "/invite/invalid");
  }

  const client = new pg.Client(DATABASE_URL);

  let balance = 0;
  try {
    await client.connect();
    const res = await client.query(
      `
        SELECT balance
        FROM accounts
        WHERE id = $1::uuid;
      `,
      [session],
    );

    const [account] = res.rows;
    balance = account.balance;
  } catch (err) {
    console.error("Non-fatal error querying account balance: ", err);
  } finally {
    await client.end();
  }

  return { session, balance };
};
