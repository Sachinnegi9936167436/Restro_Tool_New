# 🍽️ Restaurant Website Lead Finder

A production-ready SaaS dashboard for web development agencies to discover restaurants in **Uttarakhand** that don't have a website and run targeted outreach campaigns.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔍 **Smart Search** | Google Places Nearby Search API across 20+ Uttarakhand cities |
| 🌐 **Website Detection** | Auto-flag restaurants as "No Website" or "Has Website" |
| 📊 **Analytics Dashboard** | Charts for monthly leads, city distribution, categories |
| 📋 **Lead Management** | Full pipeline: New → Contacted → Interested → Follow Up → Client → Lost |
| 📧 **Email Campaigns** | SMTP + Resend, HTML templates, variable interpolation, confirm-before-send |
| 💬 **SMS / WhatsApp** | Twilio + WhatsApp Business Cloud API with rate limiting |
| 📁 **Export** | CSV, Excel (.xlsx), PDF with filters |
| 🔐 **Authentication** | JWT-based auth with HTTP-only cookies |
| 🐳 **Docker** | One-command setup with PostgreSQL |
| 🎨 **Dark UI** | Modern SaaS dashboard with animations, glass effects |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or use Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

**Minimum required:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — random secret (32+ chars)
- `GOOGLE_PLACES_API_KEY` — for restaurant search

### 3. Start Database (Docker)

```bash
# Start only PostgreSQL
docker-compose up postgres -d
```

### 4. Run Migrations and Seed

```bash
# Push schema to database
npx prisma db push --config prisma.config.ts

# Create admin user and seed email templates
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 and log in with:
- **Email:** admin@agency.com
- **Password:** Admin123!

---

## 🔑 API Keys Setup

### Google Places API
1. Go to Google Cloud Console
2. Enable Places API (New) and Geocoding API
3. Create an API Key
4. Add it in the Settings page

### SMTP (Gmail)
1. Enable 2FA on your Gmail
2. Generate an App Password
3. Configure SMTP in Settings

### Resend
1. Sign up at resend.com
2. Add your API key in Settings

### Twilio
1. Sign up at twilio.com
2. Get Account SID, Auth Token, and a phone number

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Login, me, logout
│   │   ├── search/       # Google Places search
│   │   ├── restaurants/  # CRUD + export
│   │   ├── email/        # Send, templates, logs
│   │   ├── sms/          # Send
│   │   ├── dashboard/    # Stats
│   │   └── settings/     # App settings
│   ├── login/            # Login page
│   └── dashboard/        # All dashboard pages
├── lib/
│   ├── auth.ts           # JWT utilities
│   ├── email.ts          # SMTP + Resend + templates
│   ├── export.ts         # CSV, Excel, PDF
│   ├── google-places.ts  # Places API integration
│   ├── prisma.ts         # DB client singleton
│   ├── rate-limit.ts     # Rate limiter
│   ├── sms.ts            # Twilio + WhatsApp
│   ├── utils.ts          # Helpers + constants
│   └── validators.ts     # Zod schemas
└── middleware.ts          # Auth guard
```

---

## 🐳 Docker Deployment

```bash
docker-compose up -d --build
docker exec restolead_app npx prisma db push --config prisma.config.ts
docker exec restolead_app npm run db:seed
```

---

## 📧 Template Variables

| Variable | Description |
|---|---|
| {{RestaurantName}} | Name of the restaurant |
| {{City}} | City of the restaurant |
| {{Address}} | Full address |
| {{AgencyName}} | Your agency name |
| {{AgencyWebsite}} | Your agency website |
| {{AgencyEmail}} | Your agency email |
| {{AgencyPhone}} | Your agency phone |

---

## 🛠️ Tech Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · PostgreSQL · Prisma ORM v7 · JWT Auth · Nodemailer · Resend · Twilio · Recharts · xlsx · jspdf · Zod
