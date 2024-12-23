import pg from "pg";

export default new pg.Pool({ ssl: true });
