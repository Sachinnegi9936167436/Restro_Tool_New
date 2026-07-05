/**
 * Email sending via Nodemailer (SMTP) and Resend
 */
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

export type EmailProvider = 'smtp' | 'resend'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  provider?: EmailProvider
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

import { EMAIL_TEMPLATES, interpolateTemplate } from './email-templates'

export { EMAIL_TEMPLATES, interpolateTemplate }

/** Send email via SMTP (Nodemailer) */
async function sendViaSMTP(params: SendEmailParams): Promise<EmailResult> {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  }

  if (!config.auth.user || !config.auth.pass) {
    return { success: false, error: 'SMTP credentials not configured' }
  }

  const transporter = nodemailer.createTransport(config)
  const from = params.from || process.env.SMTP_FROM || 'noreply@agency.com'

  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { success: true, messageId: info.messageId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Send email via Resend */
async function sendViaResend(params: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured' }

  const resend = new Resend(apiKey)
  const from = params.from || process.env.RESEND_FROM || 'noreply@agency.com'

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Send an email using the configured provider */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const provider = params.provider || 'smtp'
  if (provider === 'resend') return sendViaResend(params)
  return sendViaSMTP(params)
}

/** Built-in email templates */
