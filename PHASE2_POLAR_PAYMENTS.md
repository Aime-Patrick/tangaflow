# TangaFlow - Phase 2 Low-Level Design (MongoDB + Polar Payments)

## Project Overview

TangaFlow is a presentation and fundraising platform built with Next.js.

The main goal is:

1. Display a PowerPoint presentation.
2. Show a QR code during the presentation.
3. Audience scans the QR code.
4. Audience enters a donation amount.
5. Audience pays using Polar Checkout.
6. Raised amount updates automatically.
7. Progress bar updates in real-time on the presentation screen.

This is the MVP.

Do not build donation history, user accounts, leaderboards, analytics, SSE, WebSockets, or multi-tenancy yet.

---

# Campaign Philosophy: Session-Based Hidden IDs

## The Problem with Per-PPT Campaigns

If each PPT creates a new campaign:

* Presenter uploads 3 PPTs → 3 separate campaigns
* Donations split across campaigns
* QR code changes with each PPT
* Progress bar resets

Bad UX.

## TangaFlow Approach: Session Key

Use a **session key** that persists during the presentation.

**One session = one campaign = one QR code = all donations.**

```text
User Action              Backend Action
─────────────           ──────────────────────────────
Start Presentation  →     Auto-generate session key
                      →     Create campaign in MongoDB
                      →     Generate QR → /donate/{sessionKey}

Upload PPT          →     Link PPT to current session
                      →     Session key stays the same
                      →     QR code stays the same

Upload Another PPT  →     Still same session
                      →     Still same campaign
                      →     Still same QR code
                      →     Donations still accumulate here

End Session         →     Campaign finalized
                      →     Ready for new session
```

## Session Key Generation

```ts
// Short, URL-friendly, collision-resistant
function generateSessionKey(): string {
  return crypto.randomUUID().slice(0, 12);
  // Example: "a1b2c3d4e5f6"
}
```

## Multiple Sessions (Future)

When user starts a new presentation:

```ts
const campaign = await Campaign.create({
  _id: generateSessionKey(),
  name: "Church Sunday Service",
  targetAmount: 10000,
  raisedAmount: 0,
  currency: "USD",
  qrEnabled: true,
  qrText: "Scan to Donate",
});
```

Each session gets its own campaign automatically.

Donations are linked to the session, not the PPT.

## Why Session Key > Campaign ID

| Concept | Per-PPT Campaign | Session Key |
|---------|------------------|-------------|
| Upload 3 PPTs | 3 campaigns | 1 campaign |
| Donations | Split | Unified |
| QR code | Changes | Same |
| Progress bar | Resets | Accumulates |
| UX | Confusing | Clean |

---

# Tech Stack

* Next.js 16 App Router (Turbopack)
* TypeScript
* Tailwind CSS v4
* shadcn/ui (base-ui)
* Sonner
* Framer Motion
* MongoDB Atlas Free Tier
* Mongoose
* Polar Payments (@polar-sh/sdk)
* TanStack Query v5
* Zustand (UI state)

---

# Source of Truth

Previously: `localStorage`

Now: `MongoDB`

MongoDB becomes the single source of truth for:

* Target amount
* Raised amount
* Campaign information
* QR configuration
* Presentation configuration

localStorage should only be used for UI preferences:

* theme
* sidebar state
* temporary UI settings

---

# Database Design

## Collection: campaigns

```ts
{
  _id: string;           // sessionKey (auto-generated)
  name: string;          // event name (user-entered)
  targetAmount: number;  // in cents
  raisedAmount: number;  // in cents (updated by webhook)
  currency: string;      // "USD", "EUR", etc.
  qrEnabled: boolean;
  qrText: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Example:

```json
{
  "_id": "a1b2c3d4e5f6",
  "name": "Sunday Service",
  "targetAmount": 10000,
  "raisedAmount": 2500,
  "currency": "USD",
  "qrEnabled": true,
  "qrText": "Scan to Donate"
}
```

**Note:** PPT files are stored in localStorage (blob URLs), not in MongoDB.

For MVP there will only be ONE campaign per session. Future support for multiple campaigns should remain possible.

---

# First-Time Upload Flow

When user uploads first PPT, show event name dialog:

```text
User Action                    UI Response
─────────────                 ──────────────────────────────
Upload first PPT        →     Show Skeleton (16:9)
                      →     Parse PPTX file
                      →     Show EventNameDialog
                      →     User enters "Sunday Service"
                      →     Create campaign in MongoDB
                      →     Save sessionKey to localStorage
                      →     Fade-in PPT (0.4s animation)
                      →     Show QR code with donation URL

Upload another PPT      →     No dialog (sessionKey exists)
                      →     Show Skeleton
                      →     Parse PPTX file
                      →     Fade-in PPT
                      →     Same QR code, same campaign
```

## EventNameDialog Component

```tsx
// src/components/workspace/EventNameDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EventNameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

export function EventNameDialog({ open, onSubmit }: EventNameDialogProps) {
  const [name, setName] = useState("");

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name Your Event</DialogTitle>
          <DialogDescription>
            Enter a name for your fundraising event. You can change this later
            in settings.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="e.g., Sunday Service, School Fundraiser"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Button onClick={() => onSubmit(name)} disabled={!name.trim()}>
          Start Presentation
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

## Settings: Change Event Name

In Settings sheet, add event name field:

```text
Settings
─────────────────
Theme: [ Light ] [ Dark ]

─────────────────
Event Name: [ Sunday Service ]

─────────────────
Currency: [ USD ▼ ]
Target Amount (cents): [ 10000 ]

─────────────────
Payment Method: [ Polar ▼ ]
- Polar (Card payments)
- Mobile Money (M-Pesa, MTN)
- Bank Transfer

Donation URL (QR Code): [ https://.../donate/a1b2c3d4e5f6 ]
(read-only for Polar, editable for MoMo/Bank)

[ Save Settings ]
```

## Payment Methods

| Method | QR Content | User Input |
|--------|------------|------------|
| Polar | Donation URL (auto) | None |
| Mobile Money | USSD code / phone | User enters |
| Bank Transfer | Bank details | User enters |

Changes save to MongoDB on explicit Save button click.

---

# File Storage

**PPT files stored in localStorage** (blob URLs), not on server.

```ts
// When user uploads PPT
const fileUrl = URL.createObjectURL(file);
localStorage.setItem("presentationFile", fileUrl);
localStorage.setItem("presentationFileName", file.name);
```

## Why localStorage for Files?

| Approach | Pros | Cons |
|----------|------|------|
| localStorage | No server, instant, free | 5-10MB limit, device-only |
| Server upload | Persistent, shareable | Needs storage service, costs |

**MVP choice:** localStorage is simplest.

---

# Payment Flow

```text
Presentation Screen
        ↓
     QR Code
        ↓
Donation Page
        ↓
Enter Amount
        ↓
Polar Checkout
        ↓
Payment Success
        ↓
Webhook
        ↓
MongoDB Update
        ↓
Presentation Refresh
        ↓
Progress Bar Updates
```

---

# QR Code

Generate QR pointing to:

```text
https://domain.com/donate/{sessionKey}
```

Do not generate Polar links directly. Always point to our donation page.

---

# Donation Page

Route: `/donate/[campaignId]`

Features:

* Campaign title
* Current progress
* Raised amount
* Target amount
* Amount input field
* Donate button

Layout:

```text
Campaign Name

$2,500 / $10,000

[ Amount Input ]

[ Donate ]
```

Validation:

* Minimum donation = $1
* Amount must be positive

---

# Loading Animation

## Skeleton Loader

When PPT is parsing, show a 16:9 skeleton rectangle:

```tsx
<Skeleton className="w-full shadow-xl" style={{ aspectRatio: "16/9" }} />
```

## PPT Transition

After parsing completes (300ms delay):

1. Skeleton disappears
2. PPT fades in with scale animation (0.4s)

```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
```

---

# Polar Integration

## Install

```bash
pnpm add @polar-sh/sdk
```

## Environment Variables

```env
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_DONATION_PRODUCT_ID=
SUCCESS_URL=http://localhost:3000/donate/success
MONGODB_URI=
```

## Polar Product Setup

Create **one product** in Polar Dashboard:

```text
Product Name:    Donation
Description:     Support this cause with a donation
Pricing:         Custom Price (allow customer to enter amount)
```

**Key settings:**
- Enable "Custom price" so users can enter any amount
- Set minimum to $1 (100 cents)
- No recurring/subscription
- No license key needed

**How it works:**

```text
1. User enters $5 on your donation page
2. Your API calls Polar with amount: 500 (cents)
3. Polar creates checkout with that amount
4. User pays on Polar's hosted checkout
5. Webhook fires → you update MongoDB
```

**The product is just a container** - the actual amount is passed dynamically via the `amount` parameter in your checkout API call.

---

# API Routes

## Create Campaign (Auto-generated)

Route: `POST /api/campaigns`

Called automatically when user uploads first PPT and enters event name.

Request:

```json
{
  "name": "Sunday Service",
  "targetAmount": 10000,
  "currency": "USD"
}
```

Response:

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "Sunday Service",
  "targetAmount": 10000,
  "raisedAmount": 0,
  "currency": "USD"
}
```

## Update Campaign

Route: `PATCH /api/campaigns/:id`

Called when user saves settings.

Request:

```json
{
  "name": "Updated Name",
  "targetAmount": 15000,
  "currency": "EUR",
  "qrEnabled": true,
  "qrText": "Scan to Donate"
}
```

Response:

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "Updated Name",
  "targetAmount": 15000,
  "raisedAmount": 2500,
  "currency": "EUR"
}
```

## Get Campaign

Route: `GET /api/campaigns/:id`

Response:

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "Church Fundraiser",
  "targetAmount": 10000,
  "raisedAmount": 2500,
  "currency": "USD",
  "qrEnabled": true,
  "qrText": "Scan to Donate"
}
```

## Create Checkout

Route: `POST /api/checkout`

Request:

```json
{
  "campaignId": "a1b2c3d4e5f6",
  "amountInCents": 5000
}
```

Actions:

1. Validate amount (minimum 100 cents = $1).
2. Create Polar checkout session.
3. Attach campaignId as metadata.
4. Return checkout URL.

Response:

```json
{
  "checkoutUrl": "https://checkout.polar.sh/..."
}
```

Frontend immediately redirects.

---

# Amount Units Convention

All amounts in the system use **cents** (not dollars).

```ts
// Examples
500    = $5.00
1000   = $10.00
10000  = $100.00
```

**API Request:**

```json
{
  "amountInCents": 5000
}
```

**Database:**

```ts
raisedAmount: 2500  // cents
targetAmount: 10000 // cents
```

**Frontend Display:**

```ts
`$${(amountInCents / 100).toFixed(2)}`
// "$25.00"
```

Never mix dollars and cents.

---

## Polar Webhook

Route: `POST /api/webhook`

Only process: `order.paid`

Ignore all other events.

Steps:

1. **Verify webhook signature** (CRITICAL - never skip this).
2. Extract amount.
3. Extract campaignId.
4. Update campaign:

```ts
campaign.raisedAmount += amount;
```

5. Save.

Response:

```json
{
  "received": true
}
```

### Webhook Security

```ts
// src/app/api/webhook/route.ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("polar-signature");

  // NEVER skip this check in production
  const isValid = polar.webhooks.verify({
    body,
    signature: signature!,
    secret: process.env.POLAR_WEBHOOK_SECRET!,
  });

  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process webhook...
}
```

**NEVER deploy with:**

```ts
// ❌ BAD
function verifyWebhookSignature() {
  return true;
}
```

**ALWAYS use Polar's official verification.**

---

## Campaign API

Route: `GET /api/campaign/[sessionKey]`

Response:

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "School Fundraising",
  "targetAmount": 10000,
  "raisedAmount": 2500,
  "currency": "USD"
}
```

---

# File Storage Strategy

**Keep PPT in localStorage.** No server upload.

```ts
// When user uploads PPT
const fileUrl = URL.createObjectURL(file);
localStorage.setItem("presentationFile", fileUrl);
localStorage.setItem("presentationFileName", file.name);
```

## Why localStorage for Files?

| Approach | Pros | Cons |
|----------|------|------|
| localStorage | No server, instant, free | 5-10MB limit, device-only |
| Server upload | Persistent, shareable | Needs storage service, costs |
| S3/Cloudinary | Scalable, CDN | Overkill for MVP |

**MVP choice:** localStorage is simplest.

## MongoDB Schema

Only store metadata, not file:

```ts
const CampaignSchema = new Schema({
  _id: String,                    // sessionKey
  name: String,                   // "Sunday Service"
  targetAmount: Number,           // in cents
  raisedAmount: Number,           // in cents
  currency: String,               // "USD"
  qrEnabled: Boolean,
  qrText: String,
  // NO presentationFileUrl - file stays in localStorage
});
```

---

# MongoDB Setup

Create: `src/lib/mongodb.ts`

Create: `src/models/Campaign.ts`

Use Mongoose. Create reusable database connection utility. Prevent multiple connections during development.

---

# Presentation Screen

Route: `/presentation`

Display:

* PPT Viewer
* Progress Bar
* QR Code

---

# Progress Bar

Display: `$2,500 / $10,000`

Calculate:

```ts
percentage = (raisedAmount / targetAmount) * 100;
```

Progress color: `#FFFFFF`

Background: `#121212`

---

# Progress Bar Position Logic

State: `isPresentationOpen`

When FALSE:

* Progress bar renders inside PresentationPlayer

When TRUE:

* Progress bar moves above PresentationPlayer

Use Framer Motion shared layout animation.

Required: `layoutId="campaign-progress"`

Animation: `spring` with smooth upward movement.

```text
Closed:
[ Presentation Player ]
[ Progress Bar ]

Open:
[ Progress Bar ]
[ Presentation Player ]
```

Animated transition required.

---

# Real-Time Updates

Do NOT implement WebSockets, SSE, or Pusher.

Use polling.

Every 5 seconds:

```ts
GET /api/campaign/main-campaign
```

Update:

* raisedAmount
* percentage
* progress bar

This is enough for MVP.

---

# Admin Settings

Settings page should save:

* Campaign Name
* Target Amount
* Currency
* QR Enabled
* QR Text
* PPT Upload

Save directly into MongoDB. Do NOT save campaign settings to localStorage anymore.

---

# MVP Acceptance Criteria

A feature is complete when:

- [ ] User uploads PPT
- [ ] Presentation screen loads
- [ ] QR code is displayed
- [ ] User scans QR
- [ ] Donation page opens
- [ ] User enters amount
- [ ] Polar checkout opens
- [ ] Payment succeeds
- [ ] Webhook updates MongoDB
- [ ] Presentation polls every 5 seconds
- [ ] Raised amount increases
- [ ] Progress bar updates automatically
- [ ] Framer Motion animation works when presentation opens/closes

Nothing else is required for Phase 2 MVP.

---

---

# LOW-LEVEL DESIGN

---

## LLD-1: Folder Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts              # POST - Create Polar checkout session
│   │   ├── webhook/
│   │   │   └── route.ts              # POST - Polar webhook handler
│   │   └── campaigns/
│   │       └── [id]/
│   │           └── route.ts          # GET - Fetch campaign by ID
│   │
│   ├── donate/
│   │   └── [campaignId]/
│   │       └── page.tsx              # Donation page (mobile-first)
│   │
│   ├── layout.tsx                    # Root layout (unchanged)
│   └── page.tsx                      # Home - PresentationWorkspace
│
├── api/
│   ├── client.ts                     # Base fetch wrapper (optional, for consistency)
│   └── endpoints.ts                  # URL constants
│
├── features/
│   ├── campaign/
│   │   ├── api/
│   │   │   └── getCampaign.ts        # GET /api/campaign/:id
│   │   ├── hooks/
│   │   │   └── useCampaign.ts        # useQuery wrapper with 5s polling
│   │   ├── queryKeys.ts              # campaignKeys factory
│   │   ├── types.ts                  # Campaign-specific types
│   │   └── index.ts                  # Public exports
│   │
│   ├── donation/
│   │   ├── api/
│   │   │   └── createCheckout.ts     # POST /api/checkout
│   │   ├── hooks/
│   │   │   └── useCreateCheckout.ts  # useMutation wrapper
│   │   ├── components/
│   │   │   └── DonationForm.tsx      # Amount input + donate button
│   │   ├── queryKeys.ts              # donationKeys factory
│   │   ├── types.ts                  # Donation-specific types
│   │   └── index.ts                  # Public exports
│   │
│   ├── presentations/                # Existing - mostly unchanged
│   │   └── ...
│   │
│   └── qr/                           # Existing - mostly unchanged
│       └── ...
│
├── lib/
│   ├── mongodb.ts                    # Mongoose connection singleton
│   ├── polar.ts                      # Polar SDK client
│   └── queryClient.ts                # Existing - unchanged
│
├── models/
│   └── Campaign.ts                   # Mongoose schema
│
├── stores/
│   ├── presentationStore.ts          # Existing - keep for UI prefs only
│   ├── qrCodeStore.ts               # Existing - keep for UI prefs only
│   └── uiStore.ts                    # Existing - unchanged
│
├── components/
│   ├── workspace/                    # Existing workspace components
│   │   ├── PresentationWorkspace.tsx # Add polling + MongoDB state
│   │   ├── CampaignProgressBar.tsx   # Connect to campaign query
│   │   ├── QRCodeDisplay.tsx         # Generate QR from campaign data
│   │   ├── SettingsDialog.tsx        # Save to MongoDB
│   │   └── ...
│   ├── ui/                           # Existing shadcn components
│   └── shared/                       # Existing shared components
│
├── hooks/                            # Shared hooks (if any)
├── types/
│   └── index.ts                      # Global types - add Campaign, Donation
│
└── PHASE2_POLAR_PAYMENTS.md          # This file
```

---

## LLD-2: MongoDB Connection

### File: `src/lib/mongodb.ts`

```ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Key decisions:**
- Singleton pattern prevents multiple connections in dev (hot reload)
- `bufferCommands: false` fails fast if DB is unreachable
- Global cache survives hot module replacement

---

## LLD-3: Mongoose Schema

### File: `src/models/Campaign.ts`

```ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICampaign extends Document {
  _id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  qrEnabled: boolean;
  qrText: string;
  presentationTitle?: string;
  presentationFileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    _id: { type: String, required: true, default: "main-campaign" },
    name: { type: String, required: true, default: "My Campaign" },
    targetAmount: { type: Number, required: true, default: 10000 },
    raisedAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "USD" },
    qrEnabled: { type: Boolean, required: true, default: true },
    qrText: { type: String, required: true, default: "Scan to Donate" },
    presentationTitle: { type: String },
    presentationFileUrl: { type: String },
  },
  { timestamps: true }
);

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
```

**Key decisions:**
- `_id` is a string (not ObjectId) for easy URL-friendly campaign IDs
- Default values ensure first-run works without setup
- `timestamps: true` auto-manages createdAt/updatedAt

---

## LLD-4: Polar SDK Client

### File: `src/lib/polar.ts`

```ts
import { Polar } from "@polar-sh/sdk";

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("POLAR_ACCESS_TOKEN is not set");
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
```

---

## LLD-5: API Routes

### 5a. GET Campaign - `src/app/api/campaigns/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const campaign = await Campaign.findById(id).lean();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: campaign._id,
      name: campaign.name,
      targetAmount: campaign.targetAmount,
      raisedAmount: campaign.raisedAmount,
      currency: campaign.currency,
      qrEnabled: campaign.qrEnabled,
      qrText: campaign.qrText,
      presentationTitle: campaign.presentationTitle,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}
```

### 5b. POST Checkout - `src/app/api/checkout/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { polar } from "@/lib/polar";
import Campaign from "@/models/Campaign";
import { z } from "zod";

const CheckoutSchema = z.object({
  campaignId: z.string().min(1),
  amount: z.number().int().positive().min(100), // min $1 in cents
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, amount } = parsed.data;

    await connectToDatabase();
    const campaign = await Campaign.findById(campaignId).lean();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Create Polar checkout session
    const checkout = await polar.checkouts.create({
      products: [], // Will use custom amount
      amount: amount,
      currency: campaign.currency.toLowerCase() as "usd" | "eur" | "gbp",
      metadata: {
        campaignId: campaignId,
      },
      successUrl: process.env.SUCCESS_URL || `${request.nextUrl.origin}/donate/success`,
    });

    return NextResponse.json({
      checkoutUrl: checkout.url,
    });
  } catch (error) {
    console.error("Checkout creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
```

### 5c. POST Webhook - `src/app/api/webhook/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";

// Verify Polar webhook signature (implement based on Polar docs)
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // TODO: Implement HMAC verification using POLAR_WEBHOOK_SECRET
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("polar-signature") || "";

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Only process order.paid events
    if (event.type !== "order.paid") {
      return NextResponse.json({ received: true });
    }

    const order = event.data;
    const campaignId = order.metadata?.campaignId;
    const amount = order.net_amount; // Amount in cents

    if (!campaignId || !amount) {
      return NextResponse.json(
        { error: "Missing campaignId or amount" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { raisedAmount: amount } },
      { new: true }
    );

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

---

## LLD-6: Feature Modules (React Query Pattern)

### 6a. Campaign Feature

#### `src/features/campaign/types.ts`

```ts
export interface Campaign {
  id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  qrEnabled: boolean;
  qrText: string;
  presentationTitle?: string;
}
```

#### `src/features/campaign/queryKeys.ts`

```ts
export const campaignKeys = {
  all: ["campaigns"] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
};
```

#### `src/features/campaign/api/getCampaign.ts`

```ts
import type { Campaign } from "../types";

export async function getCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`/api/campaigns/${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}
```

#### `src/features/campaign/hooks/useCampaign.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { getCampaign } from "../api/getCampaign";
import { campaignKeys } from "../queryKeys";

export function useCampaign(id: string = "main-campaign") {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaign(id),
    refetchInterval: 3000, // Poll every 3 seconds for responsive UX
    staleTime: 3000, // Consider stale after 3s
  });
}
```

#### `src/features/campaign/index.ts`

```ts
export { useCampaign } from "./hooks/useCampaign";
export type { Campaign } from "./types";
export { campaignKeys } from "./queryKeys";
```

---

### 6b. Donation Feature

#### `src/features/donation/types.ts`

```ts
export interface CreateCheckoutInput {
  campaignId: string;
  amount: number; // in cents
}

export interface CheckoutResponse {
  checkoutUrl: string;
}
```

#### `src/features/donation/queryKeys.ts`

```ts
export const donationKeys = {
  all: ["donations"] as const,
  campaign: (campaignId: string) => [...donationKeys.all, campaignId] as const,
};
```

#### `src/features/donation/api/createCheckout.ts`

```ts
import type { CreateCheckoutInput, CheckoutResponse } from "../types";

export async function createCheckout(input: CreateCheckoutInput): Promise<CheckoutResponse> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create checkout");
  return res.json();
}
```

#### `src/features/donation/hooks/useCreateCheckout.ts`

```ts
import { useMutation } from "@tanstack/react-query";
import { createCheckout } from "../api/createCheckout";
import { toast } from "sonner";

export function useCreateCheckout() {
  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (data) => {
      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error("Failed to start checkout. Please try again.");
      console.error("Checkout error:", error);
    },
  });
}
```

#### `src/features/donation/components/DonationForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { useCreateCheckout } from "../hooks/useCreateCheckout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DonationFormProps {
  campaignId: string;
  currency: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  // ... etc
};

export function DonationForm({ campaignId, currency }: DonationFormProps) {
  const [amount, setAmount] = useState<string>("");
  const createCheckout = useCreateCheckout();
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents < 100) {
      return; // Min $1
    }

    createCheckout.mutate({
      campaignId,
      amount: amountInCents,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {symbol}
        </span>
        <Input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="pl-8"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={createCheckout.isPending}
        className="w-full"
      >
        {createCheckout.isPending ? "Processing..." : "Donate"}
      </Button>
    </form>
  );
}
```

#### `src/features/donation/index.ts`

```ts
export { useCreateCheckout } from "./hooks/useCreateCheckout";
export { DonationForm } from "./components/DonationForm";
export type { CreateCheckoutInput, CheckoutResponse } from "./types";
```

---

## LLD-7: Donation Page

### `src/app/donate/[campaignId]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { DonationForm } from "@/features/donation";

interface DonatePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function DonatePage({ params }: DonatePageProps) {
  const { campaignId } = await params;

  await connectToDatabase();
  const campaign = await Campaign.findById(campaignId).lean();

  if (!campaign) {
    notFound();
  }

  const percentage = Math.min(
    100,
    Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)
  );

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Campaign Info */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">
            {campaign.name}
          </h1>
          <p className="text-text-secondary">
            {campaign.raisedAmount.toLocaleString()} /{" "}
            {campaign.targetAmount.toLocaleString()} {campaign.currency}
          </p>
          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#DFDFDF] transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Donation Form */}
        <DonationForm
          campaignId={campaignId}
          currency={campaign.currency}
        />
      </div>
    </div>
  );
}
```

---

## LLD-8: Workspace Integration

### Changes to `src/components/workspace/PresentationWorkspace.tsx`

1. **Replace local state with campaign query:**

```ts
// BEFORE (local state)
const [raisedAmount, setRaisedAmount] = useState(7540);
const [targetAmount, setTargetAmount] = useState(10000);
const [currency, setCurrency] = useState("USD");

// AFTER (MongoDB via React Query)
import { useCampaign } from "@/features/campaign";

const { data: campaign, isLoading } = useCampaign("main-campaign");
const raisedAmount = campaign?.raisedAmount ?? 0;
const targetAmount = campaign?.targetAmount ?? 10000;
const currency = campaign?.currency ?? "USD";
```

2. **Generate QR code from campaign data:**

```ts
const qrUrl = campaign?.qrEnabled
  ? `${window.location.origin}/donate/${campaign.id}`
  : "";
```

3. **Update settings to save to MongoDB:**

```ts
// Settings changes should call PATCH /api/campaigns/:id
// This will be implemented as useUpdateCampaign mutation
```

---

## LLD-9: Progress Bar Animation

### Changes to `src/components/workspace/CampaignProgressBar.tsx`

The progress bar already exists. The key change is connecting it to the polling campaign query.

```tsx
"use client";

import { motion } from "framer-motion";

interface CampaignProgressBarProps {
  raisedAmount: number;
  targetAmount: number;
  currency: string;
}

export function CampaignProgressBar({
  raisedAmount,
  targetAmount,
  currency,
}: CampaignProgressBarProps) {
  const percentage = Math.min(100, Math.round((raisedAmount / targetAmount) * 100));
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  return (
    <motion.div
      layoutId="campaign-progress"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full"
    >
      <div className="flex items-baseline justify-between text-sm font-bold mb-2 text-[#DFDFDF]">
        <span>{symbol}{raisedAmount.toLocaleString()}</span>
        <span className="text-xs opacity-60">
          Target: {symbol}{targetAmount.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#DFDFDF]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
```

---

## LLD-10: Real-Time Polling Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                    PresentationWorkspace                      │
│                                                              │
│  useCampaign(sessionKey)                                     │
│       │                                                      │
│       ├── refetchInterval: 3000ms                            │
│       │                                                      │
│       ├── GET /api/campaigns/:sessionKey                     │
│       │       │                                              │
│       │       ├── MongoDB query                             │
│       │       └── Return campaign data                      │
│       │                                                      │
│       └── Update React state                                │
│              │                                               │
│              ├── CampaignProgressBar (auto-updates)          │
│              ├── QRCodeDisplay (url changes)                 │
│              └── SettingsDialog (current values)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Webhook (async)
                              │
                    ┌─────────▼─────────┐
                    │   Polar Webhook    │
                    │   POST /api/webhook│
                    │         │          │
                    │   Update MongoDB   │
                    │   raisedAmount +=  │
                    └───────────────────┘
```

---

## LLD-11: Migration Checklist

### From localStorage to MongoDB

| Data | Before (localStorage) | After (MongoDB) |
|------|----------------------|-----------------|
| raisedAmount | `useState` in workspace | `campaign.raisedAmount` from query |
| targetAmount | `useState` in workspace | `campaign.targetAmount` from query |
| currency | `useState` in workspace | `campaign.currency` from query |
| qrContent | `useState` in workspace | Generated from `campaign._id` |
| layoutPreset | `localStorage("tangaflow-layout")` | Keep as-is (UI preference) |
| pptx files | `localStorage` (pptxStorage) | Keep as-is for MVP |

### Settings Save Flow

```text
User changes setting in SettingsDialog
        ↓
Call PATCH /api/campaigns/:id
        ↓
Update MongoDB document
        ↓
React Query invalidates campaign query
        ↓
Refetch campaign data
        ↓
UI updates with new values
```

---

## LLD-12: Error Handling

| Error | Handling |
|-------|----------|
| Campaign not found | Show "Campaign not found" on donation page |
| Checkout creation fails | Toast error, stay on page |
| Webhook fails | Return 500, Polar retries |
| Polling fails | Show last known data, retry next interval |
| MongoDB connection fails | Return 500 from API routes |

---

## LLD-13: Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tangaflow

# Polar
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUCCESS_URL=http://localhost:3000/donate/success
```

---

## LLD-14: Implementation Order

### Step 1: MongoDB Setup
- [ ] Create `src/lib/mongodb.ts`
- [ ] Create `src/models/Campaign.ts`
- [ ] Add MONGODB_URI to env
- [ ] Test connection

### Step 2: Campaign API
- [ ] Create `GET /api/campaigns/[id]`
- [ ] Create `POST /api/checkout`
- [ ] Create `POST /api/webhook`
- [ ] Test with curl/Postman

### Step 3: Campaign Feature Module
- [ ] Create `src/features/campaign/` folder structure
- [ ] Implement queryKeys, types, api, hooks
- [ ] Test useCampaign hook

### Step 4: Donation Feature Module
- [ ] Create `src/features/donation/` folder structure
- [ ] Implement queryKeys, types, api, hooks, components
- [ ] Test useCreateCheckout hook

### Step 5: Donation Page
- [ ] Create `/donate/[campaignId]/page.tsx`
- [ ] Test mobile flow

### Step 6: Workspace Integration
- [ ] Replace local state with useCampaign
- [ ] Connect CampaignProgressBar to polling
- [ ] Update QRCodeDisplay to use campaign data
- [ ] Test real-time updates

### Step 7: Settings Migration
- [ ] Update SettingsDialog to save to MongoDB
- [ ] Remove localStorage campaign saves
- [ ] Test settings persistence

### Step 8: Polish & Test
- [ ] Test full donation flow end-to-end
- [ ] Verify webhook updates raised amount
- [ ] Test polling updates progress bar
- [ ] Test Framer Motion animations
