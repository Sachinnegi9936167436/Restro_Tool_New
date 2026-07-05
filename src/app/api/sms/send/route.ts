import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSms } from '@/lib/sms'
import { sendSmsSchema } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = sendSmsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { restaurantId, toPhone, message, provider } = parsed.data

  // Rate limiting
  const limit = parseInt(process.env.SMS_RATE_LIMIT_PER_HOUR || '20')
  const rateCheck = checkRateLimit(`sms:${user.userId}`, limit)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'SMS rate limit reached' }, { status: 429 })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  // Log
  const log = await prisma.smsLog.create({
    data: { restaurantId, message, toPhone, provider: provider || 'twilio', status: 'PENDING' },
  })

  const result = await sendSms({ to: toPhone, message, provider })

  await prisma.smsLog.update({
    where: { id: log.id },
    data: { status: result.success ? 'SENT' : 'FAILED', error: result.error, sentAt: result.success ? new Date() : undefined },
  })

  return NextResponse.json({ success: result.success, messageId: result.messageId, error: result.error })
}
