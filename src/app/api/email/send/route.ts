import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendEmailSchema } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = sendEmailSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { restaurantId, toEmail, subject, body: htmlBody, provider } = parsed.data

    // Rate limiting
    const limit = parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '50')
    const rateCheck = checkRateLimit(`email:${user.userId}`, limit)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Email rate limit reached. Resets at ${new Date(rateCheck.resetAt).toLocaleTimeString()}`,
          resetAt: rateCheck.resetAt,
        },
        { status: 429 }
      )
    }

    // Find restaurant
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

    // Create log entry (pending)
    const log = await prisma.emailLog.create({
      data: {
        restaurantId,
        subject,
        body: htmlBody,
        toEmail,
        fromEmail: process.env.SMTP_FROM || process.env.RESEND_FROM || 'noreply@agency.com',
        provider: provider || 'smtp',
        status: 'PENDING',
      },
    })

    // Send email
    const result = await sendEmail({ to: toEmail, subject, html: htmlBody, provider })

    // Update log
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        error: result.error,
        sentAt: result.success ? new Date() : undefined,
      },
    })

    // Update lead status if new
    if (result.success && restaurant.leadStatus === 'NEW') {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { leadStatus: 'CONTACTED' },
      })
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      remaining: rateCheck.remaining,
    })
  } catch (err) {
    console.error('Email send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
