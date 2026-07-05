import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { restaurantUpdateSchema } from '@/lib/validators'
import { getAuthUser } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      emailLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      smsLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ restaurant })
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()
  const parsed = restaurantUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const updated = await prisma.restaurant.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ restaurant: updated })
  } catch {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  try {
    await prisma.restaurant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }
}
