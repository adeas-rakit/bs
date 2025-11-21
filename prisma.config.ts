import 'dotenv/config'
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
  if (process.env.JENIS_DB === 'mysql') {
    return process.env.DATABASE_URL_MYSQL;
  }
  return process.env.DATABASE_URL;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
      seed: "tsx prisma/seed.ts"
  },
  datasource: {
   url: getDatabaseUrl()?.toString()??''
 }
});