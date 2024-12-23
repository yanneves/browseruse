import db from "./database.ts";
import moniker from "./moniker/index.ts";

const query = `
  INSERT INTO invites (id)
  VALUES($1::text)
  RETURNING id;
`;

export default async function invite() {
  try {
    const res = await db.query(query, [moniker(3).join("-")]);
    const [inserted] = res.rows;
    console.info("Invite created successfully:", inserted.id);
  } catch (err) {
    console.error("Error creating invite:", err);
  }
}
