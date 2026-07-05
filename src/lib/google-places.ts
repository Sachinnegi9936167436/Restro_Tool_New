/**
 * LocationIQ Integration (replacing Google Places API)
 * Uses LocationIQ Search (Forward Geocoding) and Nearby APIs.
 */

import { prisma } from './prisma'
import { findWebsiteAndEmails, isGenericName, resolveBusinessName } from './email-finder'

export interface PlaceResult {
  placeId: string
  name: string
  address: string
  city: string
  state: string
  country?: string
  email?: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  mapsUrl?: string
  rating?: number
  reviews?: number
  businessStatus?: string
  openingHours?: unknown
  photos?: PhotoReference[]
  businessTypes?: string[]
  hasWebsite: boolean
  category: string
}

export interface PhotoReference {
  name: string
  widthPx: number
  heightPx: number
}

export interface SearchParams {
  city: string
  category: string
  radiusMeters: number
  state?: string
  country?: string
}

/** City coordinates lookup for Uttarakhand cities */
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Dehradun: { lat: 30.3165, lng: 78.0322 },
  Haridwar: { lat: 29.9457, lng: 78.1642 },
  Rishikesh: { lat: 30.0869, lng: 78.2676 },
  Haldwani: { lat: 29.2183, lng: 79.5130 },
  Roorkee: { lat: 29.8543, lng: 77.8880 },
  Kashipur: { lat: 29.2130, lng: 78.9620 },
  Rudrapur: { lat: 28.9845, lng: 79.3961 },
  Mussoorie: { lat: 30.4598, lng: 78.0644 },
  Nainital: { lat: 29.3919, lng: 79.4542 },
  Almora: { lat: 29.5971, lng: 79.6593 },
  Pithoragarh: { lat: 29.5830, lng: 80.2183 },
  Chamoli: { lat: 30.4024, lng: 79.3289 },
  Bageshwar: { lat: 29.8360, lng: 79.7712 },
  Uttarkashi: { lat: 30.7268, lng: 78.4354 },
  Tehri: { lat: 30.3780, lng: 78.4804 },
  Kotdwar: { lat: 29.7449, lng: 78.5265 },
  Ramnagar: { lat: 29.3933, lng: 79.1235 },
  Lansdowne: { lat: 29.8380, lng: 78.6860 },
  Chakrata: { lat: 30.7000, lng: 77.8700 },
  Pauri: { lat: 30.1487, lng: 78.7803 },
}

/** Map category names to OpenStreetMap tags */
const CATEGORY_TYPE_MAP: Record<string, string> = {
  Restaurant: 'amenity:restaurant',
  Cafe: 'amenity:cafe',
  Bakery: 'shop:bakery',
  'Hotel Restaurant': 'tourism:hotel',
  Dhaba: 'amenity:restaurant',
  'Fast Food': 'amenity:fast_food',
}

/** Retrieve the LocationIQ API key from Settings database or environment variables */
async function getApiKey(): Promise<string> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'LOCATIONIQ_API_KEY' },
    })
    if (setting?.value) return setting.value
  } catch (e) {
    console.error('Error fetching LOCATIONIQ_API_KEY from database:', e)
  }
  return process.env.LOCATIONIQ_API_KEY || ''
}

/** Geocode a city to get lat/lng using LocationIQ Search API */
export async function geocodeCity(
  city: string,
  state = '',
  country = 'India'
): Promise<{ lat: number; lng: number }> {
  // If state is not provided and the city is one of the built-in Uttarakhand ones, look it up
  if ((!state || state === 'Uttarakhand') && country === 'India') {
    const coords = CITY_COORDINATES[city]
    if (coords) return coords
  }

  const apiKey = await getApiKey()
  if (!apiKey) throw new Error('LOCATIONIQ_API_KEY is not configured')

  const query = encodeURIComponent(`${city}${state ? ', ' + state : ''}, ${country}`)
  const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${query}&format=json&limit=1`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Could not geocode city: ${city}. Status: ${res.status}`)
  }

  const data = await res.json()
  if (!Array.isArray(data) || !data.length) {
    throw new Error(`Could not geocode city: ${city}, ${state}, ${country}`)
  }

  const firstResult = data[0]
  const lat = parseFloat(firstResult.lat)
  const lng = parseFloat(firstResult.lon)
  return { lat, lng }
}

/** Search nearby places using LocationIQ API (Nearby or Search depending on city availability) */
export async function searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new Error('LOCATIONIQ_API_KEY is not configured')

  const placeType = CATEGORY_TYPE_MAP[params.category] || 'amenity:restaurant'
  let places: any[] = []

  if (params.city && params.city.trim() !== '') {
    // 1. City provided: run coordinate-based nearby search
    const coords = await geocodeCity(params.city, params.state ?? '', params.country ?? 'India')
    const url = `https://us1.locationiq.com/v1/nearby?key=${apiKey}&lat=${coords.lat}&lon=${coords.lng}&tag=${placeType}&radius=${params.radiusMeters}&format=json&extratags=1&addressdetails=1`

    const res = await fetch(url)
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`LocationIQ Nearby API error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    if (data.error) {
      if (data.error === 'Unable to geocode' || data.error.includes('No places found')) {
        places = []
      } else {
        throw new Error(`LocationIQ API Error: ${data.error}`)
      }
    } else {
      places = Array.isArray(data) ? data : []
    }
  } else {
    // 2. City not provided: run a text search query across country/state
    const searchQuery = `${params.category}${params.state ? ', ' + params.state : ''}, ${params.country ?? 'India'}`
    const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&tag=${placeType}&limit=50&format=json&extratags=1&addressdetails=1`

    const res = await fetch(url)
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`LocationIQ Search API error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    if (data.error) {
      if (data.error === 'Unable to geocode' || data.error.includes('No places found')) {
        places = []
      } else {
        throw new Error(`LocationIQ API Error: ${data.error}`)
      }
    } else {
      places = Array.isArray(data) ? data : []
    }
  }

  const results = places.map((place: Record<string, any>) => {
    const address = place.address || {}
    const parsedCity = params.city || address.city || address.town || address.village || address.suburb || ''
    return transformPlaceResult(place, parsedCity, params.state ?? '', params.country ?? 'India', params.category)
  })

  // Concurrency-limited enrichment function (max 3 concurrent requests to prevent search engine blocking)
  const CONCURRENCY_LIMIT = 3
  const enrichedResults: PlaceResult[] = []
  
  const chunks: PlaceResult[][] = []
  for (let i = 0; i < results.length; i += CONCURRENCY_LIMIT) {
    chunks.push(results.slice(i, i + CONCURRENCY_LIMIT))
  }
  
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (r) => {
        try {
          if (isGenericName(r.name)) {
            const actualName = await resolveBusinessName(r.address, r.category)
            if (actualName) {
              r.name = actualName
            }
          }
          const enrichment = await findWebsiteAndEmails(r.name, r.city, r.country ?? 'India', r.website)
          if (enrichment.website) {
            r.website = enrichment.website
            r.hasWebsite = true
          }
          r.email = enrichment.emails.length > 0 ? enrichment.emails[0] : undefined
        } catch (err) {
          console.error(`Failed to enrich restaurant ${r.name}:`, err)
        }
        return r
      })
    )
    enrichedResults.push(...chunkResults)
  }

  return enrichedResults
}

/** Transform LocationIQ place object to our PlaceResult shape */
function transformPlaceResult(
  place: Record<string, any>,
  city: string,
  state: string,
  country: string,
  category: string
): PlaceResult {
  const extratags = place.extratags || {}
  const address = place.address || {}

  // Website extraction
  const website = extratags.website || extratags['contact:website'] || extratags.url || ''
  const hasWebsite = !!website && website.trim() !== ''

  // Phone extraction
  const phone = extratags.phone || extratags['contact:phone'] || extratags.telephone || undefined

  // Name extraction
  const name =
    place.name ||
    address.restaurant ||
    address.cafe ||
    address.bakery ||
    address.fast_food ||
    address.hotel ||
    address.amenity ||
    address.shop ||
    address.name ||
    (place.display_name ? place.display_name.split(',')[0].trim() : 'Unknown')

  // Map URL using OSM ID
  const mapsUrl = `https://www.openstreetmap.org/${place.osm_type || 'node'}/${place.osm_id}`

  // Coordinates
  const latitude = parseFloat(place.lat) || 0
  const longitude = parseFloat(place.lon) || 0

  // Types
  const businessTypes = place.type ? [place.type] : (place.class ? [place.class] : [])

  // Opening hours
  const openingHours = extratags.opening_hours || undefined

  return {
    placeId: `${place.osm_type || 'node'}-${place.osm_id || place.place_id}`,
    name,
    address: place.display_name || '',
    city,
    state: state || address.state || address.province || address.county || '',
    country: country || address.country || '',
    latitude,
    longitude,
    phone,
    website: website || undefined,
    mapsUrl,
    rating: undefined,
    reviews: 0,
    businessStatus: 'OPERATIONAL',
    openingHours,
    photos: [],
    businessTypes,
    hasWebsite,
    category,
  }
}

/** Stub photo URL builder (LocationIQ / OSM has no photo hosting) */
export function getPhotoUrl(photoName: string, maxWidth = 400): string {
  return ''
}
