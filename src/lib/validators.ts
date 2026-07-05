/**
 * Zod validation schemas for all API inputs
 */
import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// ── Search ────────────────────────────────────────────────────
export const searchSchema = z.object({
  city: z.string().optional().default(''),
  category: z.enum(['Restaurant', 'Cafe', 'Bakery', 'Hotel Restaurant', 'Dhaba', 'Fast Food']),
  radiusMeters: z.number().int().min(500).max(50000),
  state: z.string().optional().default(''),
  country: z.string().optional().default('India'),
})

// ── Restaurant Update ─────────────────────────────────────────
export const restaurantUpdateSchema = z.object({
  leadStatus: z
    .enum(['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLIENT', 'LOST'])
    .optional(),
  notes: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().optional(),
})

// ── Restaurant Filters ────────────────────────────────────────
export const restaurantFiltersSchema = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  hasWebsite: z.enum(['true', 'false', 'all']).optional().default('all'),
  leadStatus: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'city', 'rating', 'reviews', 'createdAt', 'leadStatus'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ── Email Send ────────────────────────────────────────────────
export const sendEmailSchema = z.object({
  restaurantId: z.string().min(1),
  toEmail: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Email body is required'),
  provider: z.enum(['smtp', 'resend']).optional().default('smtp'),
})

// ── Email Template ────────────────────────────────────────────
export const emailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
})

// ── SMS Send ──────────────────────────────────────────────────
export const sendSmsSchema = z.object({
  restaurantId: z.string().min(1),
  toPhone: z.string().min(8, 'Invalid phone number'),
  message: z.string().min(1).max(1600),
  provider: z.enum(['twilio', 'whatsapp']).optional().default('twilio'),
})

// ── Settings ──────────────────────────────────────────────────
export const settingsSchema = z.record(z.string(), z.string())

// ── Export ────────────────────────────────────────────────────
export const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']),
  hasWebsite: z.enum(['true', 'false', 'all']).optional().default('all'),
  city: z.string().optional(),
  category: z.string().optional(),
  leadStatus: z.string().optional(),
})
