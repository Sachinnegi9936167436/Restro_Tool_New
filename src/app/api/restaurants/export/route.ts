import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCsv, generateExcel, generatePdf } from '@/lib/export'
import { exportSchema } from '@/lib/validators'
import { getAuthUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

/** Helper to return a binary file response using the standard Web API Response */
function binaryResponse(data: Uint8Array, contentType: string, filename: string): Response {
  return new Response(data as any, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const parsed = exportSchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { format, hasWebsite, city, category, leadStatus } = parsed.data
  const where: Prisma.RestaurantWhereInput = {}

  if (city) where.city = { contains: city }
  if (category) where.category = category
  if (hasWebsite === 'true') where.hasWebsite = true
  if (hasWebsite === 'false') where.hasWebsite = false
  if (leadStatus) where.leadStatus = leadStatus as never

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const rows = restaurants.map((r) => ({
    name: r.name,
    category: r.category,
    city: r.city,
    address: r.address,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    website: r.website ?? undefined,
    rating: r.rating ?? undefined,
    reviews: r.reviews ?? undefined,
    hasWebsite: r.hasWebsite,
    leadStatus: r.leadStatus,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt.toISOString().split('T')[0],
  }))

  const timestamp = new Date().toISOString().split('T')[0]

  if (format === 'csv') {
    const buffer = generateCsv(rows)
    return binaryResponse(buffer, 'text/csv; charset=utf-8', `restaurants-${timestamp}.csv`)
  }

  if (format === 'excel') {
    const buffer = generateExcel(rows)
    return binaryResponse(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `restaurants-${timestamp}.xlsx`)
  }

  if (format === 'pdf') {
    const buffer = generatePdf(rows)
    return binaryResponse(buffer, 'application/pdf', `restaurants-${timestamp}.pdf`)
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}
