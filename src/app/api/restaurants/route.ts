import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { restaurantFiltersSchema } from '@/lib/validators'
import { getAuthUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = req.nextUrl
    const params = restaurantFiltersSchema.safeParse(Object.fromEntries(searchParams))

    if (!params.success) {
      return NextResponse.json({ error: params.error.issues[0].message }, { status: 400 })
    }

    const { city, category, hasWebsite, leadStatus, search, page, limit, sortBy, sortOrder } =
      params.data

    const where: Prisma.RestaurantWhereInput = {}

    if (city) where.city = { contains: city }
    if (category) where.category = category
    if (hasWebsite === 'true') where.hasWebsite = true
    if (hasWebsite === 'false') where.hasWebsite = false
    if (leadStatus) where.leadStatus = leadStatus as never
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [total, restaurants] = await Promise.all([
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      restaurants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Restaurants list error:', err)
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}
