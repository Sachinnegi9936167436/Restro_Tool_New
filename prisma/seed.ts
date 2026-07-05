/**
 * Prisma Seed — creates default admin user and seeded email templates
 * Run with: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { EMAIL_TEMPLATES } from '../src/lib/email'

import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const email = process.env.ADMIN_EMAIL || 'admin@agency.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'
  const hash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hash, name: 'Admin', role: 'ADMIN' },
  })
  console.log(`✅ Admin user created: ${email}`)

  // Email templates
  for (const t of Object.values(EMAIL_TEMPLATES)) {
    const exists = await prisma.emailTemplate.findFirst({ where: { name: t.name } })
    if (!exists) {
      await prisma.emailTemplate.create({
        data: { name: t.name, subject: t.subject, body: t.body, isDefault: true },
      })
      console.log(`✅ Template created: ${t.name}`)
    }
  }

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
