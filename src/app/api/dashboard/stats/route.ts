import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [
    totalRestaurants,
    noWebsite,
    hasWebsite,
    contacted,
    interested,
    followUp,
    client,
    lost,
    cityStats,
    categoryStats,
    leadsForMonthlyChart,
    recentLeads,
    searchHistory,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { hasWebsite: false } }),
    prisma.restaurant.count({ where: { hasWebsite: true } }),
    prisma.restaurant.count({ where: { leadStatus: 'CONTACTED' } }),
    prisma.restaurant.count({ where: { leadStatus: 'INTERESTED' } }),
    prisma.restaurant.count({ where: { leadStatus: 'FOLLOW_UP' } }),
    prisma.restaurant.count({ where: { leadStatus: 'CLIENT' } }),
    prisma.restaurant.count({ where: { leadStatus: 'LOST' } }),
    // City distribution
    prisma.restaurant.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    // Category distribution
    prisma.restaurant.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    // Get leads for monthly chart
    prisma.restaurant.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    // Recent leads
    prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, city: true, hasWebsite: true, leadStatus: true, createdAt: true },
    }),
    // Recent searches
    prisma.searchHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  // Group monthly leads in memory
  const groups: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    groups[label] = 0
  }

  leadsForMonthlyChart.forEach((l) => {
    const label = l.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (groups[label] !== undefined) {
      groups[label]++
    }
  })

  const monthlyStats = Object.entries(groups).map(([month, count]) => ({
    month,
    count,
  }))

  return NextResponse.json({
    stats: {
      totalRestaurants,
      noWebsite,
      hasWebsite,
      contacted,
      interested,
      followUp,
      client,
      lost,
    },
    charts: {
      cityStats: cityStats.map((c: { city: string; _count: { id: number } }) => ({ city: c.city, count: c._count.id })),
      categoryStats: categoryStats.map((c: { category: string; _count: { id: number } }) => ({ category: c.category, count: c._count.id })),
      monthlyStats,
      websiteRatio: [
        { name: 'No Website', value: noWebsite },
        { name: 'Has Website', value: hasWebsite },
      ],
    },
    recentLeads,
    searchHistory,
  })
}
