import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@repo/db/schema"; // Adjust the path to your schema file

const sql = neon(process.env.DATABASE_URL!);
console.log("DATABASE_URL", process.env.DATABASE_URL);
export const db = drizzle({ client: sql, logger: true, schema: schema });
