import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  migrations: {
    seed: 'node --import tsx/esm prisma/seed.ts',
  },
})
