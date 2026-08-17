import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const text = await readFile("migrations/0001_create_users.sql", "utf8");

await sql.query(text);

console.log("bitti");
