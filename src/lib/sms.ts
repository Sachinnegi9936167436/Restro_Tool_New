/**
 * SMS / WhatsApp sending via Twilio and WhatsApp Business Cloud API
 */

export interface SendSmsParams {
  to: string
  message: string
  provider?: 'twilio' | 'whatsapp'
}

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/** Send SMS via Twilio */
async function sendViaTwilio(params: SendSmsParams): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const body = new URLSearchParams({ To: params.to, From: from, Body: params.message })
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Twilio error' }
    return { success: true, messageId: data.sid }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Send WhatsApp message via WhatsApp Business Cloud API */
async function sendViaWhatsApp(params: SendSmsParams): Promise<SmsResult> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp API credentials not configured' }
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
  const to = params.to.replace(/\D/g, '') // strip non-digits

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: params.message },
      }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error?.message || 'WhatsApp error' }
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Send SMS / WhatsApp using the specified provider */
export async function sendSms(params: SendSmsParams): Promise<SmsResult> {
  if (params.provider === 'whatsapp') return sendViaWhatsApp(params)
  return sendViaTwilio(params)
}

/** Built-in SMS templates */
export const SMS_TEMPLATES = [
  {
    id: 'sms_basic',
    name: 'Basic Intro',
    body: `Hello {{RestaurantName}}! We noticed your restaurant in {{City}} doesn't have a website yet. We can build one for you! Contact {{AgencyName}} at {{AgencyPhone}} to learn more.`,
  },
  {
    id: 'sms_offer',
    name: 'Special Offer',
    body: `Hi {{RestaurantName}}! Your restaurant in {{City}} deserves an amazing website. {{AgencyName}} is offering affordable web packages starting ₹4999. Call {{AgencyPhone}} or visit {{AgencyWebsite}}.`,
  },
]
