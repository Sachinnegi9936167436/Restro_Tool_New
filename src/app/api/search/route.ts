import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchNearbyPlaces } from '@/lib/google-places'
import { searchSchema } from '@/lib/validators'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Auth check
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = searchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { city, category, radiusMeters, state, country } = parsed.data

    // Check if LocationIQ API key is configured
    const setting = await prisma.settings.findUnique({
      where: { key: 'LOCATIONIQ_API_KEY' },
    })
    const apiKey = setting?.value || process.env.LOCATIONIQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'LocationIQ API key is not configured. Please add it in Settings.' },
        { status: 503 }
      )
    }

    // Fetch from LocationIQ
    const places = await searchNearbyPlaces({ city, category, radiusMeters, state, country })

    let newCount = 0
    const results = []

    // Upsert each place into the database
    for (const place of places) {
      const existing = await prisma.restaurant.findUnique({
        where: { placeId: place.placeId },
      })

      if (existing) {
        // Update existing record with fresh data
        const updated = await prisma.restaurant.update({
          where: { placeId: place.placeId },
          data: {
            name: place.name,
            address: place.address,
            phone: place.phone,
            email: place.email || undefined,
            website: place.website,
            mapsUrl: place.mapsUrl,
            rating: place.rating,
            reviews: place.reviews,
            hasWebsite: place.hasWebsite,
            businessStatus: place.businessStatus,
            openingHours: place.openingHours ? JSON.stringify(place.openingHours) : undefined,
            photos: place.photos ? JSON.stringify(place.photos) : undefined,
            businessTypes: place.businessTypes ? JSON.stringify(place.businessTypes) : undefined,
            country: place.country || undefined,
          },
        })
        results.push(updated)
      } else {
        // Create new record
        const created = await prisma.restaurant.create({
          data: {
            placeId: place.placeId,
            name: place.name,
            category: place.category,
            address: place.address,
            city: place.city,
            state: place.state ?? '',
            country: place.country ?? 'India',
            email: place.email,
            latitude: place.latitude,
            longitude: place.longitude,
            phone: place.phone,
            website: place.website,
            mapsUrl: place.mapsUrl,
            rating: place.rating,
            reviews: place.reviews,
            hasWebsite: place.hasWebsite,
            businessStatus: place.businessStatus,
            openingHours: place.openingHours ? JSON.stringify(place.openingHours) : undefined,
            photos: place.photos ? JSON.stringify(place.photos) : undefined,
            businessTypes: place.businessTypes ? JSON.stringify(place.businessTypes) : undefined,
            searchRadius: radiusMeters,
          },
        })
        results.push(created)
        newCount++
      }
    }

    // Log search history
    await prisma.searchHistory.create({
      data: { city, category, radius: radiusMeters, resultsCount: places.length, newLeads: newCount },
    })

    return NextResponse.json({
      success: true,
      total: results.length,
      newLeads: newCount,
      results,
    })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 }
    )
  }
}
