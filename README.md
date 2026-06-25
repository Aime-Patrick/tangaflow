# TangaFlow

A presentation and fundraising platform built with Next.js. Display PowerPoint presentations with real-time QR code donations.

## Features

- **PPT Viewer** - Upload and present PowerPoint files
- **QR Code Donations** - Audience scans QR to donate
- **Real-time Progress** - Progress bar updates as donations come in
- **Multiple Payment Methods** - Polar (cards), Mobile Money, Bank Transfer
- **Session-based Campaigns** - Auto-generated campaign IDs, hidden from users

## Tech Stack

- Next.js 16 (Turbopack)
- TypeScript
- Tailwind CSS v4
- MongoDB (Mongoose)
- Polar Payments
- TanStack Query v5
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)
- Polar account (for payments)

### Installation

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Add your MongoDB URI and Polar credentials to .env

# Run development server
pnpm dev
```

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Polar Payments
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_DONATION_PRODUCT_ID=

# App
SUCCESS_URL=http://localhost:3000/donate/success
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── campaigns/        # Campaign CRUD
│   │   ├── checkout/         # Polar checkout
│   │   └── webhook/          # Polar webhook
│   └── donate/
│       ├── [campaignId]/     # Donation page
│       └── success/          # Payment success
├── components/
│   └── workspace/
│       ├── PresentationWorkspace.tsx  # Main workspace
│       ├── PresentationPlayer.tsx     # PPT viewer
│       ├── QRCodeDisplay.tsx          # QR code
│       ├── SettingsDialog.tsx         # Settings sheet
│       └── EventNameDialog.tsx        # First-time dialog
├── features/
│   ├── campaign/             # Campaign module
│   └── donation/             # Donation module
├── lib/
│   ├── mongodb.ts            # DB connection
│   └── utils.ts              # Utilities
└── models/
    └── Campaign.ts           # Mongoose schema
```

## How It Works

1. **Upload PPT** - User drags/drops a PowerPoint file
2. **Enter Event Name** - First-time dialog asks for event name
3. **Campaign Created** - Auto-generated session key stored in MongoDB
4. **QR Code Shown** - Points to `/donate/{sessionKey}`
5. **Audience Donates** - Scans QR, enters amount, pays via Polar
6. **Progress Updates** - Webhook updates MongoDB, polling refreshes UI

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/campaigns` | POST | Create campaign |
| `/api/campaigns/[id]` | GET | Get campaign |
| `/api/campaigns/[id]` | PATCH | Update campaign |
| `/api/checkout` | POST | Create Polar checkout |
| `/api/webhook` | POST | Polar webhook handler |

## Testing Payments

1. Create a product in Polar Dashboard (custom price, $1 minimum)
2. Add `POLAR_DONATION_PRODUCT_ID` to `.env`
3. Use ngrok for webhook testing: `ngrok http 3000`
4. Add ngrok URL to Polar webhook settings

## License

MIT
