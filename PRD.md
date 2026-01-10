# D’FOOTPRINT

# 📘 PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Project Name

**D’FOOTPRINT – Handmade Footwear Website**

## Document Purpose

This PRD defines the functional, technical, design, SEO, and operational requirements for building a **conversion-focused ecommerce website** for D’FOOTPRINT using **Next.js (TypeScript) deployed on Vercel**, with **Paystack payments**, **Google Ads / Merchant readiness**, and support for **custom handmade footwear workflows**.

This document is intended to be sufficient for:

- Frontend developers
- AI agents
- Designers
- SEO specialists
- Ads specialists
- Product stakeholders

---

## 1. BUSINESS OVERVIEW

### 1.1 Business Description

D’FOOTPRINT is a **handmade footwear brand** selling:

- Slippers
- Slides
- Other handmade footwear

Customers may:

- Purchase from existing designs previously made
- Submit designs to be recreated
- Request approved custom edits (e.g. removing buckles, adding roses), sometimes at additional cost

The business:

- Is owned and run by a single individual
- Is not currently registered
- Has no physical store
- Operates primarily via **TikTok discovery** and **WhatsApp sales**
- Is based in **Lagos**, with **nationwide delivery across Nigeria**

---

### 1.2 Current State Problems

The current sales model has limitations:

- No centralized product catalog
- No SEO visibility
- No Google Ads / Merchant eligibility
- Manual order handling
- Limited trust for first-time buyers

The website must directly address these issues **without breaking the custom nature of the business**.

---

## 2. GOALS & SUCCESS METRICS

### 2.1 Primary Goals

1. Enable **direct checkout and payment** via Paystack
2. Support **Google Ads and Google Merchant Center**
3. Increase trust for first-time buyers
4. Showcase past work to validate quality
5. Support nationwide orders efficiently

### 2.2 Secondary Goals

- Allow customers to request customization clearly and safely
- Support gift purchases (custom packaging + greeting cards)
- Lay groundwork for long-term SEO growth

### 2.3 Success Metrics

- Completed purchases
- Ad approval and active Google Shopping campaigns
- Reduced WhatsApp back-and-forth
- Lower order disputes
- Improved customer trust and clarity

---

## 3. TARGET USERS

### 3.1 User Segments

**1. Direct Buyers**

- Want ready-made designs
- Care about price, delivery, and quality
- Likely coming from ads or TikTok

**2. Custom Buyers**

- Want to recreate or modify a design
- Willing to wait for approval
- Care about flexibility and communication

**3. Gift Buyers**

- Buying for others
- Want packaging and greeting cards
- Highly sensitive to brand perception (“must not feel cheap”)

---

## 4. PRODUCT MODEL

### 4.1 Product Reality

- ~250 designs completed historically
- Photos exist for many, but not all
- Photos are phone-taken, not studio
- Products are handmade and produced on demand
- Production is outsourced to 3 shoemakers

### 4.2 Product Types

### Type A: Featured Designs

- Have photos
- Fixed base price (starting from ₦12,000)
- Have size and color variants
- Optional custom edits (approval-based)
- Eligible for Google Merchant listing

### Type B: Custom Orders

- User submits a design reference
- Custom edits reviewed before approval
- Price may change
- Not eligible for Google Merchant listing

---

## 5. CUSTOMIZATION RULES

Customization is **not automatic**.

### 5.1 Customization Constraints

- All custom edits require approval
- Some edits incur additional fees
- Not all requests can be fulfilled

### 5.2 UX Implication

The website must:

- Clearly explain that customization is subject to approval
- Avoid implying instant customization
- Avoid misleading checkout flows

---

## 6. DELIVERY, RETURNS & OPERATIONS

### 6.1 Delivery

- Nationwide delivery across Nigeria
- Buyer pays delivery fees
- Fulfillment via:
    - Pickup
    - Dispatch rider
    - Waybill

### 6.2 Returns & Exchanges

- Handled **case by case**
- Especially when the issue originates from the business
- Policy must be transparent but flexible

---

## 7. TECHNICAL REQUIREMENTS

### 7.1 Tech Stack (Locked)

- **Framework:** Next.js (TypeScript)
- **Hosting:** Vercel
- **Payments:** Paystack
- **SEO:** Server-side rendering using App Router

### 7.2 Architecture Principles

- SEO-first rendering
- Mobile-first design
- Fast load times
- Clear separation of server and client components

### 7.3 Data Management

The system must support:

- Product listings
- Variants (size, color)
- Optional customization notes
- Order data
- Payment confirmation

(Exact storage implementation left open for engineering decision.)

---

## 8. SITE STRUCTURE

### 8.1 Required Pages

- Home
- Shop (Featured Designs)
- Product Detail Page
- Custom Order Page
- Cart
- Checkout
- About D’FOOTPRINT
- Contact
- FAQ
- Shipping & Returns
- Privacy Policy
- Terms & Conditions

---

## 9. DESIGN REQUIREMENTS

### 9.1 Core Design Principle

> Must not feel cheap
> 

This is the dominant constraint guiding all visual decisions.

### 9.2 Design Direction

- Clean
- Modern
- Minimal
- Product-first
- No clutter
- No gimmicky animations

### 9.3 Typography

- Sans-serif fonts only
- High readability on mobile
- Clear hierarchy (hero → product title → body)

### 9.4 Color Usage

- Existing brand colors must be used
- Limited palette
- Strong contrast for accessibility
- CTA buttons must be visually dominant

---

## 10. UX & CONVERSION REQUIREMENTS

### 10.1 Homepage

Must immediately communicate:

- What D’FOOTPRINT sells
- That products are handmade
- That customization is possible
- That nationwide delivery is available

### 10.2 Product Pages

Must include:

- Large images
- Clear price
- Size and color selection
- Customization notes (optional)
- Delivery and return info
- Strong “Add to Cart” CTA

### 10.3 Checkout

- Simple
- No forced account creation
- Clear breakdown of costs
- Paystack integration only

---

## 11. SEO REQUIREMENTS

### 11.1 Technical SEO

- Clean URLs
- Sitemap generation
- Indexable pages
- Optimized images
- Fast Core Web Vitals

### 11.2 On-Page SEO

Each page must have:

- Unique title
- Meta description
- H1 heading
- Alt text for images

### 11.3 Product SEO

Focus on:

- Slippers
- Slides
- Handmade footwear
- Nigeria-specific search intent

---

## 12. GOOGLE ADS & MERCHANT CENTER

### 12.1 Merchant Eligibility

Only **Featured Designs** are eligible.

Required:

- Accurate pricing
- Real product images
- Clear delivery policy
- Return policy page
- Contact information

### 12.2 Ads Strategy Alignment

- Ads drive traffic to specific product pages
- Custom orders are upsold after trust is built

---

## 13. SECURITY & COMPLIANCE

- HTTPS enforced
- Secure payment handling
- Clear privacy policy
- Transparent business communication

---

## 14. NON-GOALS

- No mobile app
- No blog at launch
- No Instagram-driven UX
- No fake scarcity or misleading claims
- No over-engineered animations

---

## 15. RISKS & MITIGATIONS

| Risk | Mitigation |
| --- | --- |
| Trust issues | Clear copy, past work showcase |
| Merchant rejection | Strict product accuracy |
| Custom order confusion | Explicit UX explanations |
| Phone-quality images | Clean layout, good spacing |

---

## 16. FINAL NOTE

This product is **not a generic ecommerce site**.

It is a **custom handmade commerce system** optimized for:

- Trust
- Ads
- Scalability
- Real Nigerian buying behavior

Any solution that:

- Treats this like Shopify inventory
- Hides customization constraints
- Feels cheap or cluttered

**Is incorrect.**