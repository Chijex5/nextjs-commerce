# Custom orders — redesign plan

Status: proposal, not built yet. Written 2026-10-12.

## 1. What's wrong today

| Area | Problem |
|---|---|
| Form | One long page with 14 fields. "Request title", "Design brief", "Budget min / max" and a date picker are a blank-page test for a non-technical buyer. Contact details come first, before the customer has invested anything. |
| Flow | Every request is treated as "new idea", even though most are "this design, but different" (PRD §1.1). The product page's "Want it different?" link drops the product, so the owner has to ask which pair they meant. |
| Pricing | Nothing is priced until the owner quotes by hand, even for edits that always cost the same. |
| Conversation | There's no way to ask a clarifying question, so it moves to WhatsApp and the record is lost. The customer can only pay or ignore a quote; they can't ask for changes. |
| Payment | One full payment. There's no deposit or balance, and no checkpoint before dispatch. |
| After paying | Tracking is a lookup on `/orders`, and the status chips show raw enum values (`awaiting_payment`). There's no progress photo, so "what I ordered vs what I got" is possible. |
| UI | `custom-order-request-section.tsx` still uses the old `dp-*` inline-style design, which doesn't match the redesigned `/custom-orders` landing page. The placeholder says "Bridal block heel", but the brand makes slippers and slides. |

## 2. What the research says (short version)

- **Start from the product.** Nike By You, Drifter Leather and Ilisabawn (a Lagos brand) all start custom orders from an existing design. That covers our most common case.
- **Price common edits with a fixed menu.** Use add-ons like Ko-fi's add-on checkboxes or Drifter's "+€10 colour", and send only the unusual requests to manual review.
- **Use a guided wizard, not one long form.** Short steps with a progress bar, tap-to-choose options instead of blank text boxes, contact details last, and drafts saved automatically (NN/g, Zuko, Baymard).
- **Quotes come out of a conversation.** Etsy custom orders, VGen and Shopify quote apps all use a message thread, then an itemised quote with an expiry date and *Accept & pay* / *Request changes* buttons.
- **Deposit first, balance before dispatch.** J. FitzPatrick and Petrie Boots both use a 50% non-refundable deposit. Paystack has no way to split one invoice into parts, so a deposit and a balance are two separate charges, which our checkout already supports.
- **Progress photo before finishing.** Missing progress photos and long silences are the top complaints about custom makers. One photo checkpoint, auto-approved after 48h, solves it.
- **Legal (Nigeria, FCCPA s.122/127).** "No refunds" can't be enforced if the item doesn't match the agreed spec. Store the approved spec and size on the order as evidence.

Sources are in the three research summaries from the planning session. The key URLs are listed at the bottom.

## 3. Decisions (from the owner)

1. Payment: **deposit, then balance** before dispatch.
2. Common edits have **mostly fixed prices**, which we publish.
3. The conversation happens **fully on the site**, with email notifications.
4. **Progress photo approval for recreations and new designs**, not for simple edits.

## 4. The new customer flow

### Entry points
- Product page → **"Customise this design"** → `/custom-orders/request?product=<handle>`, which opens the wizard with that product already selected (path A).
- `/custom-orders` landing → **"Start a request"** → wizard step 1.
- `/account` → "My custom requests" list.

### The wizard (mobile first, one question per screen, draft saved in localStorage)

| # | Screen | Path A — change a design | Path B — from a photo | Path C — new idea |
|---|---|---|---|---|
| 1 | What would you like? | Three picture cards (skipped if a product was passed in) | | |
| 2 | Starting point | Product grid with search; preselected from the product page | Upload 1–4 photos *or* paste a TikTok/IG/Pinterest link | Pick a style: slipper / slide / palm / other, then photos optional |
| 3 | What should we change? | **Edit menu** as cards with their price (remove buckle — free, add roses +₦2,000, change colour +₦1,500 → colour swatches), plus "Something else" (needs review) | Same chips plus "what's different from the photo?" (one line each) | Guided prompts: material, colour, details, plus a short note |
| 4 | Size | EU size grid 36–47 with UK underneath, number of pairs; optional foot length in cm with a "How to measure" guide; "Not sure, I'll tell you in the chat" | | |
| 5 | When do you need it? | Chips: No rush / Within 2 weeks / By a date (shows the date picker). Budget chips for B/C only: under ₦15k / ₦15–25k / ₦25–40k / ₦40k+ / Advise me | | |
| 6 | Review & your details | Summary of everything with Edit links. **Path A shows a live estimate:** base price + edits + size surcharge, "Deposit today: ₦0 — you pay only after we approve". Name, phone (+234, required), email (required, because notifications go there) | | |
| 7 | Sent | Request number, "We reply within 24h (Mon–Sat)", what happens next, button **"Open my request"** (the hub) | | |

There's no request title field; it's generated, e.g. "Amara slide — roses, colour change".

### The request hub — `/custom-orders/r/<requestNumber>?t=<token>`

One page per request, reachable from every email without logging in (a signed token, like the quote tokens we already have), and also listed in `/account` for logged-in users. It contains:

1. **A status timeline** in plain words: Received → Approved & priced → Deposit paid → Being made → *(Approve photo)* → Balance paid → On the way → Delivered.
2. **An action card** showing whatever the customer needs to do right now: reply to a question / accept or request changes to the quote / pay the deposit / approve the photo / pay the balance.
3. **A message thread** with the owner, with photo attachments. Every owner message sends an email with a link back here.
4. **The spec**: base design, edits, size, reference photos. It's frozen as the "approved spec" when the deposit is paid.

This replaces the quote panel bolted onto the request form and the custom-request lookup on `/orders`. Old links redirect.

## 5. Lifecycle (statuses)

| Status | Who acts | Customer sees | Email |
|---|---|---|---|
| `submitted` | — | "Received, we'll reply within 24h" | Confirmation to customer; alert to owner |
| `needs_info` *(new)* | Customer replies in the thread | A question and a reply box | "We have a quick question" |
| `quoted` | Customer | Itemised quote, deposit amount, expiry, **Accept & pay deposit** / **Request changes** | Quote email, plus reminders (the existing cron) |
| `rejected` | — | The reason and a suggested alternative product | "We can't make this one, but…" |
| `in_production` *(deposit paid)* | Owner | ETA; spec is frozen | "Deposit received, we've started" |
| `awaiting_approval` *(new, B/C only)* | Customer | Progress photo with **Approve** / **Request a tweak**; auto-approves after 48h | "Please check your pair" |
| `balance_due` *(new)* | Customer | **Pay balance ₦X**; nothing ships until it's paid | Balance request plus reminders |
| `ready` | Owner | Hands over to the normal order flow for delivery tracking | "Your pair is on the way" (existing order emails) |
| `completed` / `cancelled` / `expired` | — | Final state | — |

- **Path A shortcut:** if a request has only menu edits, the owner sees **"Approve at ₦X"**. One click turns the estimate into the quote.
- **Changes:** a customer's "Request changes" sends the request back to review and voids the old quote (the quote version check already exists). Changes after the deposit is paid go through the thread and may add a line to the balance.
- **Order conversion:** the order is created when the **deposit** is paid (today it's on full payment). The order carries `amount_paid` and `balance_due`, and dispatch is blocked while `balance_due > 0`.

## 6. Admin side

- **Custom requests inbox** (redesign of `/admin/custom-order-requests`)
  - Tabs: Needs reply · Awaiting customer · In production · Balance due · Done.
  - Each card shows the path badge, estimate and days waiting.
- **Request detail page**
  - Left: spec and reference photos.
  - Right: the thread, with canned replies (needs a photo / can't do it / timeline).
  - **Quote builder:** line items prefilled from the edit menu, plus custom lines, delivery and deposit %; preview what the customer sees.
  - "Approve at estimate" button for path A.
  - Upload progress photo → `awaiting_approval`.
  - Mark ready → creates the balance charge.
  - Internal field: which of the 3 makers is assigned (never shown to the customer).
- **Settings → Custom orders**
  - Edit menu: name, customer-facing description, image, price, active, order, "needs review" flag.
  - Size surcharge rule (e.g. EU 45+ costs ₦X).
  - Deposit % (default 50).
  - Reply-time promise text.
  - Photo auto-approve hours.
  - On/off switch (replaces the `CUSTOM_ORDER_REQUESTS_ENABLED` env var).

## 7. Data changes (one migration)

- **`custom_order_requests`** gets these new columns:
  - `kind` (modify / recreate / new) and `base_product_id`
  - `edits` (jsonb snapshot of the chosen edits with prices), `estimate_amount`
  - `size_eu`, `pairs`, `foot_length_cm`
  - `budget_band`, `deadline_kind` (`desired_date` stays)
  - `reference_links` (jsonb)
  - `access_token_hash`
  - `approved_spec` (jsonb), `deposit_percent`, `amount_paid`
  - `progress_photo_url`, `photo_sent_at`, `photo_approved_at`
  - `assigned_maker`
  - Old columns (title, description, budget min/max) stay for existing rows.
- **Status list:** add `needs_info`, `awaiting_approval`, `balance_due`, `ready`, `expired`. Map existing statuses: `awaiting_payment` → `quoted`, `paid` → `in_production`.
- **`custom_order_quotes`:** `breakdown` becomes typed line items; add `deposit_amount`.
- **New `custom_edit_options`** table (the price list).
- **New `custom_request_messages`** table: request, author (customer / owner / system), body, attachments, read_at.
- **Payments:** a `kind` of deposit or balance on the custom-quote payment metadata. The Paystack reconcile code learns to apply a balance payment to an existing order instead of creating a new one.
- **Orders:** `amount_paid`, `balance_due`.

## 8. Build phases

1. **Foundation**
   - Migration, edit-menu settings page, new wizard (all three paths, using the new design system), request hub with timeline and thread, confirmation and owner-alert emails.
   - "Customise this design" on product pages.
   - Old form and `/orders` custom lookup removed or redirected.
2. **Quote & deposit**
   - Admin quote builder with line items, "Approve at estimate", Accept / Request changes, deposit payment, order created on deposit.
3. **Production & balance**
   - Progress-photo checkpoint with 48h auto-approve (cron), balance charge with reminders, dispatch blocked until paid, handover to normal order delivery.
4. **Later**
   - WhatsApp notifications through the WhatsApp Business Cloud API: each message costs money and needs approved templates.
   - Saved foot size on the customer account.
   - "X slots this week" capacity indicator.
   - A back-in-stock style "notify me when custom orders reopen".

Each phase can be shipped on its own: phase 1 alone fixes the form, the flow and the UI, while quoting still works the current way.

## 9. Still to confirm

- The edit menu itself: which edits, prices, and which products each one applies to.
- Deposit %: 50 by default? Is it non-refundable once production starts? Should customers be allowed to pay in full upfront?
- The reply-time promise: 24h or 48h, and which days?
- Auto-approve the progress photo after 48h of no reply: yes or no?
- Size surcharge: does any size cost more?

## Key sources

- NN/g, step-by-step forms (wizards): https://www.nngroup.com/articles/wizards/
- Zuko, single-page vs multi-step forms: https://zuko.io/blog/single-page-or-multi-step-form
- Baymard, inline validation: https://baymard.com/blog/inline-form-validation
- Ilisabawn (Lagos bespoke shoes and slippers): https://ilisabawn.com/
- Drifter Leather custom orders (review): https://anyasreviews.com/drifter-leather-custom-review/
- VGen milestones: https://help.vgen.co/hc/en-us/articles/41162374214935-Milestone-FAQs
- Etsy custom orders guide: https://www.alura.io/docs/article/a-complete-guide-to-managing-custom-orders-on-etsy
- Petrie Boots deposits: https://acceptance.reach.dog/shop/c-u-at-x-tack/products/petrie-boot-deposits
- Paystack payment requests (invoices): https://mctaba.com/learn/paystack/paystack-payment-requests-and-invoices-via-api
- FCCPA refund rights (Nigeria): https://www.mondaq.com/article/1305004
