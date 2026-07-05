/**
 * Deep Web Search & Email Scraper
 * Crawls websites and queries search engines to extract public business emails.
 */

// Common false positive domains and extensions to filter out
const FALSE_POSITIVE_DOMAINS = [
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'css', 'js',
  'sentry.io', 'wixpress.com', 'wix.com', 'wordpress.org', 'wordpress.com',
  'example.com', 'domain.com', 'schema.org', 'googleapis.com', 'google.com',
  'duckduckgo.com', 'nominatim.org', 'openstreetmap.org', 'facebook.com',
  'twitter.com', 'instagram.com', 'linkedin.com', 'pinterest.com'
]

const FALSE_POSITIVE_USERNAMES = [
  'sentry', 'noreply', 'no-reply', 'email', 'yourname', 'info@domain',
  'support@domain', 'privacy', 'security', 'abuse', 'postmaster'
]

const GENERIC_NAMES = [
  'restaurant', 'cafe', 'bakery', 'dhaba', 'fast food', 'hotel', 'hotel restaurant',
  'lodging', 'amenity', 'shop', 'food', 'caterer', 'pub', 'bar', 'fast_food', 'eating house',
  'deli', 'takeaway', 'canteen'
]

// Common directory/social/aggregator domains to exclude when looking for official websites
const AGGREGATOR_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'yelp.com',
  'tripadvisor.com', 'tripadvisor.in', 'tripadvisor.co.uk', 'foursquare.com',
  'restaurantguru.com', 'zomato.com', 'swiggy.com', 'swiggy.in', 'justdial.com',
  'ubereats.com', 'grubhub.com', 'menupages.com', 'yellowpages.com',
  'opentable.com', 'maps.google.com', 'youtube.com', 'pinterest.com',
  'mapquest.com', 'yahoo.com', 'groupon.com', 'sirved.com', 'slicelife.com',
  'seamless.com', 'chownow.com', 'delivery.com', 'local.com', 'singleplatform.com',
  'locu.com', 'doordash.com', 'magicpin.in', 'dineout.co.in', 'eatsure.com',
  'posist.com', 'foodpanda.com', 'wikipedia.org', 'tumblr.com', 'tiktok.com'
]

export function isGenericName(name: string): boolean {
  const normalized = name.toLowerCase().trim()
  return GENERIC_NAMES.includes(normalized) || normalized === 'unknown' || normalized === ''
}

function cleanBusinessName(title: string): string {
  // Decode HTML entities
  let name = title
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Split by common title separators
  const separators = [' - ', ' | ', ':', ' in ', ' at ']
  for (const sep of separators) {
    if (name.includes(sep)) {
      name = name.split(sep)[0]
    }
  }
  
  // Clean up remaining junk
  name = name.trim()
  
  // If the cleaned name is still generic or too long/short, return empty
  if (isGenericName(name) || name.length > 80 || name.length < 3) {
    return ''
  }
  
  return name
}

function cleanEmails(emails: string[]): string[] {
  const unique = Array.from(new Set(emails.map(e => e.toLowerCase().trim())))
  return unique.filter(email => {
    // Basic regex check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
    
    // Check false positive domains
    if (FALSE_POSITIVE_DOMAINS.some(d => email.endsWith('.' + d) || email.includes('@' + d))) {
      return false
    }
    
    // Check false positive usernames
    if (FALSE_POSITIVE_USERNAMES.some(u => email.startsWith(u + '@'))) {
      return false
    }
    
    return true
  })
}

/** Check if a URL represents the restaurant's official website */
export function isOfficialWebsite(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    const hostname = url.hostname.toLowerCase()
    
    // Check if matches any aggregator domain
    if (AGGREGATOR_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return false
    }
    
    // Ignore search engines
    if (
      hostname.includes('google') || 
      hostname.includes('duckduckgo') || 
      hostname.includes('bing') || 
      hostname.includes('yahoo')
    ) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/** Crawl a single page to extract email addresses */
async function scrapeUrlForEmails(url: string, timeout = 3000): Promise<string[]> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    clearTimeout(id)
    
    if (!res.ok) return []
    const text = await res.text()
    
    // Find all mailto links first
    const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    const mailtos: string[] = []
    let match
    while ((match = mailtoRegex.exec(text)) !== null) {
      mailtos.push(match[1])
    }
    
    // General email regex in text
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const plainEmails = text.match(emailRegex) || []
    
    return cleanEmails([...mailtos, ...plainEmails])
  } catch (e) {
    return []
  }
}

/** Search DuckDuckGo to resolve a generic name into the actual business name */
export async function resolveBusinessName(
  address: string,
  category: string,
  timeout = 3500
): Promise<string> {
  try {
    // Clean generic prefixes from the address (e.g., "Restaurant, ")
    let segments = address.split(',').map(p => p.trim()).filter(Boolean)
    if (segments.length > 0 && isGenericName(segments[0])) {
      segments = segments.slice(1)
    }
    const addressParts = segments.slice(0, 3).join(', ')
    const query = `"${addressParts}" ${category}`
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    clearTimeout(id)
    
    if (!res.ok) return ''
    const html = await res.text()
    
    // Find the first result title
    const titleRegex = /<a class="result__a"[^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = titleRegex.exec(html)) !== null) {
      const rawTitle = match[1].replace(/<[^>]*>/g, '') // strip inner HTML tags
      const cleaned = cleanBusinessName(rawTitle)
      if (cleaned) return cleaned
    }
  } catch (e) {
    // Silence error
  }
  return ''
}

interface EnrichmentResult {
  website?: string
  emails: string[]
}

/** Deep search official website and email for a restaurant */
export async function findWebsiteAndEmails(
  name: string,
  city: string,
  country: string,
  existingWebsite?: string,
  timeout = 4000
): Promise<EnrichmentResult> {
  let emails: string[] = []
  let website = existingWebsite
  
  // 1. If we have a website, scrape it first (most reliable source!)
  if (website) {
    const siteEmails = await scrapeUrlForEmails(website, 3000)
    emails.push(...siteEmails)
    
    // Try scraping contact page
    if (emails.length === 0) {
      try {
        const contactUrl = website.endsWith('/') ? `${website}contact` : `${website}/contact`
        const contactEmails = await scrapeUrlForEmails(contactUrl, 2500)
        emails.push(...contactEmails)
      } catch {}
    }
    return { website, emails: cleanEmails(emails) }
  }
  
  // 2. No website: search DuckDuckGo to extract emails AND identify official website
  try {
    const query = `"${name}" "${city}" restaurant`
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    clearTimeout(id)
    
    if (!res.ok) return { emails: [] }
    const html = await res.text()
    
    // Extract emails from snippets
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const foundEmails = html.match(emailRegex) || []
    emails.push(...foundEmails)
    
    // Extract target URLs to scrape and look for the official website
    const hrefRegex = /class="result__url"[^>]*href="([^"]+)"/gi
    const targetUrls: string[] = []
    let match
    while ((match = hrefRegex.exec(html)) !== null && targetUrls.length < 5) {
      const targetUrl = match[1]
      // Try to identify if this is their official website
      if (!website && isOfficialWebsite(targetUrl)) {
        website = targetUrl
      }
      
      // Filter out big aggregators for crawling
      if (
        !targetUrl.includes('yelp.com') && 
        !targetUrl.includes('tripadvisor.com') && 
        !targetUrl.includes('foursquare.com') && 
        !targetUrl.includes('duckduckgo.com')
      ) {
        targetUrls.push(targetUrl)
      }
    }
    
    // Scrape top 2 target URLs for emails
    const scrapePromises = targetUrls.slice(0, 2).map(url => scrapeUrlForEmails(url, 2500))
    const scrapedResults = await Promise.all(scrapePromises)
    const allScraped = scrapedResults.flat()
    emails.push(...allScraped)
    
  } catch (e) {
    // Silence error
  }
  
  return { website, emails: cleanEmails(emails) }
}
