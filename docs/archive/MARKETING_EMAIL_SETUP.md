# Marketing Email Dashboard - Setup & Usage Guide

## Overview

You now have a complete marketing email campaign system built into your D'FOOTPRINT admin dashboard. This allows you to:

- ✅ Create email campaigns with 3 preset templates (Just Arrived, Sale, New Collection)
- ✅ Select products for campaigns with smart filtering
- ✅ Draft, preview, and schedule campaigns
- ✅ Send campaigns immediately or at scheduled times
- ✅ Track campaign analytics (opens, clicks, bounces)
- ✅ Auto-unsubscribe bounced emails

## Database & Schema

**New Tables Created:**
- `emailCampaigns` - Stores campaign metadata (name, type, subject, status, scheduling)
- `campaignProducts` - Junction table linking products to campaigns
- `campaignEmailLogs` - Tracks delivery and engagement metrics

Run migrations:
```bash
npm run db:push  # or your migration command
```

## Configuration

### 1. Verify Resend Setup

Your `.env` already has:
```
RESEND_API_KEY="re_..."
SMTP_FROM_EMAIL="noreply@dfootprint.me"
SUPPORT_EMAIL="support@dfootprint.me"
```

**Action:** Verify these are correct in your `.env` file.

### 2. Setup Resend Webhooks (For Analytics)

1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Navigate to **Settings > Webhooks**
3. Add webhook endpoint: `https://yourdomain.com/api/webhooks/resend`
4. Select events: `email.opened`, `email.clicked`, `email.bounced`
5. Copy the webhook secret and add to `.env`:
   ```
   RESEND_WEBHOOK_SECRET="your_webhook_secret"
   ```

**Note:** Webhooks allow real-time tracking of opens, clicks, and bounces.

### 3. Setup Scheduled Campaign Cron Job

The system checks for scheduled campaigns via `/api/cron/send-scheduled-campaigns`.

**Option A: Vercel Cron (Recommended)**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled-campaigns",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs every 15 minutes.

**Option B: External Cron Service**

Use [EasyCron](https://www.easycron.com) or similar:
- URL: `https://yourdomain.com/api/cron/send-scheduled-campaigns`
- Header: `Authorization: Bearer {CRON_SECRET}`
- Schedule: Every 15 minutes
- Your `CRON_SECRET` is already in `.env`

**Option C: Manual Testing**

Test locally:
```bash
curl -X POST http://localhost:3000/api/cron/send-scheduled-campaigns \
  -H "Authorization: Bearer zQss6iTKczflPCYg0bFPFWIKFikH5oW67uPo6Qq6KO0C7kkxyY8gzI1zT5OrfyQS"
```

## File Structure

```
lib/
├── email/
│   ├── marketing-campaigns.ts          # Core campaign logic
│   └── templates/
│       ├── marketing-campaign-base.tsx # Base template
│       ├── marketing-just-arrived.tsx  # Just Arrived variant
│       ├── marketing-sale.tsx          # Sale variant
│       └── marketing-collection.tsx    # Collection variant
│
app/
├── api/
│   ├── admin/campaigns/
│   │   ├── route.ts                    # GET/POST campaigns
│   │   ├── [id]/route.ts               # GET/PATCH/DELETE campaign
│   │   ├── [id]/preview/route.ts       # Generate preview HTML
│   │   ├── [id]/send/route.ts          # Send/schedule campaign
│   │   ├── [id]/analytics/route.ts     # Get campaign analytics
│   ├── cron/
│   │   └── send-scheduled-campaigns/route.ts  # Scheduled send cron
│   └── webhooks/
│       └── resend/route.ts             # Resend webhook handler
│
└── admin/campaigns/
    ├── page.tsx                        # Campaign list
    ├── new/
    │   ├── page.tsx                    # Redirect to editor
    │   └── edit/page.tsx               # Create new campaign
    └── [id]/
        ├── edit/page.tsx               # Edit campaign
        └── analytics/page.tsx          # View analytics
```

## Usage

### 1. Create a Campaign

1. Go to **Admin Dashboard > Email Campaigns**
2. Click **"New Campaign"**
3. Fill in 4 steps:
   - **Step 1:** Campaign name, type (Just Arrived/Sale/Collection), subject, preheader
   - **Step 2:** Customize header, footer, CTA button text/URL
   - **Step 3:** Select products to feature
   - **Step 4:** Send immediately or schedule for later
4. Click **"Save as Draft"** or **"Send Immediately"**

### 2. Draft Campaigns

- Access via **Status: Draft** filter
- Edit content, products, timing
- Preview email before sending
- Delete if needed

### 3. Scheduled Campaigns

- Set future send date/time
- Status shows as "Scheduled"
- Cron job automatically sends at scheduled time
- Edit until send time arrives

### 4. View Analytics

- Click campaign row → **Analytics** button
- See: Sent count, open rate, click rate, bounce rate
- Auto-refreshes every 10 seconds
- Charts show engagement trends

## API Endpoints

### List Campaigns
```
GET /api/admin/campaigns?status=DRAFT&page=1&limit=20
Response: { campaigns: [...], hasMore: bool, page: int, limit: int }
```

### Create Campaign
```
POST /api/admin/campaigns
Body: { name, type, subject, preheader, ... productIds: [...] }
Response: { message, campaignId }
```

### Get Campaign
```
GET /api/admin/campaigns/{id}
Response: { campaign: { ...campaign, products: [...] } }
```

### Update Campaign
```
PATCH /api/admin/campaigns/{id}
Body: { name, subject, productIds: [...], scheduledAt? }
Response: { message, campaignId }
```

### Preview Campaign
```
POST /api/admin/campaigns/{id}/preview
Response: { html: "...", campaign: {...} }
```

### Send/Schedule Campaign
```
POST /api/admin/campaigns/{id}/send
Body: { sendImmediately: bool, scheduledAt?: "2024-01-15T10:30:00Z" }
Response: { message, sent?: int, failed?: int, scheduledAt?: string }
```

### Get Analytics
```
GET /api/admin/campaigns/{id}/analytics
Response: { analytics: { total, sent, opened, clicked, bounced, failed, openRate, clickRate, bounceRate, failureRate } }
```

### Resend Webhook
```
POST /api/webhooks/resend
Body: { type: "email.opened|email.clicked|email.bounced", data: { message_id, email, bounce_type? } }
```

## Security

✅ **Admin Auth Required:**
- All campaign endpoints require NextAuth session
- Verifies admin user exists and is active
- Only admin users can create/edit campaigns

✅ **Cron Job Security:**
- Protected by `CRON_SECRET` header
- Must match `process.env.CRON_SECRET`

✅ **Unsubscribe Protection:**
- Uses HMAC-SHA256 token validation
- Cannot unsubscribe without valid token
- Links are one-click and email-specific

## Troubleshooting

### Emails Not Sending

1. **Verify Resend API Key** in `.env`:
   ```bash
   npm run env:check  # Check env variables
   ```

2. **Check Campaign**:
   - Must have products selected
   - Subject line required
   - Must have active subscribers

3. **Check Logs**:
   ```bash
   npm run db:logs  # View database logs
   tail -f logs/campaign-sends.log
   ```

### Scheduled Campaigns Not Sending

1. **Verify Cron Setup**:
   - Check Vercel deployment cron runs
   - Or verify external cron service is active

2. **Check Campaign Status**:
   - Must be `SCHEDULED` status
   - `scheduledAt` must be in the past

3. **Manual Test**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/send-scheduled-campaigns \
     -H "Authorization: Bearer {CRON_SECRET}"
   ```

### Webhook Not Tracking Events

1. **Verify Webhook Registered**:
   - Check Resend dashboard
   - Ensure endpoint is accessible

2. **Check Logs**:
   - Look for webhook POST requests
   - Verify 200 response returned

3. **Test Webhook**:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/resend \
     -H "Content-Type: application/json" \
     -d '{"type":"email.opened","data":{"message_id":"test","email":"user@example.com"}}'
   ```

## Testing Checklist

### Before Production

- [ ] Create test campaign with 1-2 products
- [ ] Send test email to admin email
- [ ] Verify email arrives and looks correct
- [ ] Test product links in email
- [ ] Test unsubscribe link
- [ ] Verify subscriber is marked as unsubscribed
- [ ] Schedule test campaign for 2 min in future
- [ ] Wait for cron and verify auto-send
- [ ] Check analytics update correctly
- [ ] Test with multiple products
- [ ] Test all 3 template types
- [ ] Verify bounce handling auto-unsubscribes

### Steps

1. **Create Campaign:**
   ```
   1. Admin > Email Campaigns > New Campaign
   2. Fill: "Test Campaign"
   3. Type: "Just Arrived"
   4. Subject: "Testing: New Arrivals Available"
   5. Select 2-3 products
   6. Click "Save as Draft"
   ```

2. **Preview:**
   ```
   1. Click campaign row
   2. Check HTML preview looks good
   3. Verify product images/links
   ```

3. **Send Test:**
   ```
   1. Step 4 > Send Immediately
   2. Check admin email for delivery
   3. Verify email formatting
   4. Test product links
   5. Test unsubscribe link
   ```

4. **Schedule Test:**
   ```
   1. Create new campaign
   2. Go to step 4
   3. Select date/time 3 min in future
   4. Click "Schedule Campaign"
   5. Check status is "SCHEDULED"
   6. Wait for cron to run
   7. Verify email sent
   ```

5. **Analytics Test:**
   ```
   1. Open sent campaign
   2. Click "Analytics"
   3. Should show sent count
   4. Open email in browser
   5. Wait 30 sec
   6. Refresh analytics
   7. Should show opened
   8. Click link in email
   9. Refresh analytics
   10. Should show clicked
   ```

## Next Steps

### v2 Features to Add

1. **Segmentation**: Send to specific customer groups
   - By collection purchased
   - By price range
   - By signup date
   - By engagement level

2. **A/B Testing**: Test subject lines, content variations
   - Split subscribers 50/50
   - Track performance
   - Auto-send winner

3. **Drip Campaigns**: Multi-email sequences
   - Welcome series
   - Cart abandonment
   - Post-purchase follow-up

4. **Template Builder**: Drag-and-drop email editor
   - Custom blocks
   - Save as template
   - Reuse across campaigns

5. **Advanced Analytics**:
   - Heatmaps of clicks
   - Device breakdown (mobile vs desktop)
   - Time-zone optimization
   - Subscriber engagement scoring

6. **Integration**:
   - Sync with Klaviyo
   - Facebook Ads audience sync
   - CRM integration

## Questions?

Refer to:
- Resend Docs: https://resend.com/docs
- Email Marketing Best Practices: https://mailchimp.com/resources/
- D'FOOTPRINT Docs: /docs/email-campaigns

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Maintainer:** Engineering Team
