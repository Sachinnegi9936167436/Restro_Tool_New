import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailTemplateSchema } from '@/lib/validators'
import { getAuthUser } from '@/lib/auth'
import { EMAIL_TEMPLATES } from '@/lib/email'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Seed built-in templates
  if (body.seed) {
    const builtIn = Object.values(EMAIL_TEMPLATES) as { name: string; subject: string; body: string }[]
    const created = []
    for (const t of builtIn) {
      const exists = await prisma.emailTemplate.findFirst({ where: { name: t.name } })
      if (!exists) {
        created.push(await prisma.emailTemplate.create({ data: { name: t.name, subject: t.subject, body: t.body } }))
      }
    }
    return NextResponse.json({ seeded: created.length })
  }

  const parsed = emailTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const template = await prisma.emailTemplate.create({ data: parsed.data })
  return NextResponse.json({ template }, { status: 201 })
}
