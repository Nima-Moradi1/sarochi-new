import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for database access");

export const pool = mysql.createPool({ uri: url, connectionLimit: 10 });
export const db = drizzle({ client: pool });
