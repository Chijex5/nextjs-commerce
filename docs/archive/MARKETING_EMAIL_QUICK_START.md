# Marketing Email Dashboard - Quick Start (5 Minutes)

## 1. Run Database Migrations

```bash
npm run db:push
```

This creates the 3 new tables:
- `emailCampaigns`
- `campaignProducts`
- `campaignEmailLogs`

## 2. Access Admin Dashboard

1. Go to `http://localhost:3000/admin`
2. Login with your admin credentials
3. Click **"Email Campaigns"** in sidebar

> If sidebar doesn't show Email Campaigns, add it manually:
> ```tsx
> // In components/admin/sidebar.tsx or similar
> <Link href="/admin/campaigns">Email Campaigns</Link>
> ```

## 3. Create Your First Campaign

1. Click **"New Campaign"** button
2. **Step 1 - Details:**
   - Campaign Name: `"Test Campaign"`
   - Type: `🎉 Just Arrived`
   - Subject: `"Check Out Our New Arrivals!"`
   - Preheader: `"Fresh styles just dropped..."`
   - Click **Next**

3. **Step 2 - Customize:**
   - Header Title: `"🎉 Just Arrived!"`
   - Header Subtitle: `"Discover our latest collection"`
   - CTA Button Text: `"Shop Now"`
   - CTA Button URL: `/products`
   - Click **Next**

4. **Step 3 - Products:**
   - Search and select **2-3 products**
   - Click **Next**

5. **Step 4 - Send:**
   - Click **"Save as Draft"** first
   - You're done! ✅

## 4. Send Your First Email

1. Go back to **Email Campaigns** list
2. Find your "Test Campaign"
3. Click the **eye icon** to edit
4. Click **Next** through steps
5. **Step 4:** Click **"Send Immediately"**
6. Check your admin email for delivery ✅

> Email will arrive in 1-2 minutes

## 5. Schedule a Campaign

1. Create another campaign (repeat steps above)
2. **Step 4:** Select a time **5 minutes in the future**
3. Click **"Schedule Campaign"**
4. Status will show as **"SCHEDULED"**

> The campaign will auto-send when the scheduled time arrives
> (assuming cron job is running)

## 6. View Analytics

1. After sending, go back to campaigns list
2. Find your **sent campaign**
3. Click **📊 Analytics** button
4. See real-time stats:
   - Total sent
   - Open rate
   - Click rate
   - Bounce rate

## What You Can Do Now

✅ Create unlimited marketing campaigns  
✅ Choose from 3 pre-built templates  
✅ Select any products to feature  
✅ Customize email content  
✅ Send immediately or schedule  
✅ Track opens, clicks, bounces  
✅ Auto-unsubscribe bounced emails  

## File Structure Created

```
18 new files created:
├── Database Schema (3 tables)
├── Core Logic (1 library file)
├── Email Templates (3 variants)
├── API Routes (7 endpoints)
└── Admin Pages (4 pages)
```

## Next: Advanced Setup

For production, configure:

1. **Resend Webhooks** - Real-time analytics
   ```
   Docs: /MARKETING_EMAIL_SETUP.md → "Setup Resend Webhooks"
   ```

2. **Scheduled Campaign Cron** - Auto-sending
   ```
   Docs: /MARKETING_EMAIL_SETUP.md → "Setup Scheduled Campaign Cron Job"
   ```

3. **Email Templates** - Customize designs
   ```
   Edit: /lib/email/templates/marketing-*.tsx
   ```

## Troubleshooting

**Campaign not sending?**
- Verify campaign has ≥1 product selected
- Check admin email is configured
- See `/MARKETING_EMAIL_SETUP.md` for detailed debugging

**Don't see "Email Campaigns" in admin menu?**
- Manually add link to admin sidebar
- Verify you're logged in as admin
- Check browser console for errors

**Emails going to spam?**
- Add your domain to Resend verified senders
- Improve email content (avoid spam words)
- Add real unsubscribe link (already included ✅)

## Email Preview (What Subscribers See)

Recipients receive beautifully formatted emails with:
- ✅ Header with campaign title
- ✅ Product grid with images
- ✅ Product titles and descriptions
- ✅ Call-to-action button
- ✅ Footer with company info
- ✅ One-click unsubscribe link
- ✅ Social media links
- ✅ Mobile-responsive design

## Support Resources

- 📖 Full Setup Guide: `MARKETING_EMAIL_SETUP.md`
- 📊 API Reference: `MARKETING_EMAIL_SETUP.md` → "API Endpoints"
- 🔧 Troubleshooting: `MARKETING_EMAIL_SETUP.md` → "Troubleshooting"
- 🧪 Testing: `MARKETING_EMAIL_SETUP.md` → "Testing Checklist"

## Success! 🎉

You now have a complete marketing email system.

**Next:** Try creating and sending a campaign to see it in action!

---

Questions? Refer to the full documentation:  
👉 `/MARKETING_EMAIL_SETUP.md`
