## Plan: Handle zero-amount checkout

TL;DR: Paystack cannot initialize a charge for $0, so the checkout flow needs a separate free-order path when a 100% coupon reduces the payable amount to zero. The safest approach is to keep normal Paystack flow for paid orders, but bypass Paystack entirely for free orders and complete them locally as confirmed/paid. That preserves the business value of 100% coupons instead of blocking them.

**Steps**
1. Add a zero-amount guard in [app/api/checkout/initialize/route.ts](app/api/checkout/initialize/route.ts#L124-L142) before Paystack initialization.
   - If `amountInKobo <= 0`, return a distinct response such as “payment not required” instead of calling Paystack.
   - Use the custom quote flow in [app/api/custom-order-quotes/[quoteId]/initialize/route.ts](app/api/custom-order-quotes/[quoteId]/initialize/route.ts#L92-L105) as the pattern for handling non-payable checkouts.

2. Update the checkout submit flow in [app/checkout/page.tsx](app/checkout/page.tsx#L1008-L1019).
   - If the init response indicates a free order, finalize the order locally instead of redirecting to Paystack.
   - Keep the existing Paystack path unchanged for totals above zero.

3. Ensure the order finalization path can create a completed order without a Paystack reference.
   - Reuse the same order persistence and coupon redemption logic that normal paid checkouts use.
   - Make sure coupon usage, inventory handling, and confirmation email delivery still happen.

4. Add a user-facing checkout state for zero totals in [app/checkout/page.tsx](app/checkout/page.tsx#L376-L385).
   - Show “No payment required” or equivalent when the coupon makes the total $0.
   - Hide or disable the Paystack payment action in that case.

5. Review coupon math in [lib/coupon-validation.ts](lib/coupon-validation.ts#L147-L168) and [app/api/admin/coupons/route.ts](app/api/admin/coupons/route.ts#L124-L134).
   - Confirm 100% coupons are intentionally allowed.
   - Keep the cap that prevents discounts from exceeding the cart + shipping total.

**Verification**
- Test a 100% coupon on a normal product checkout and confirm:
  - no Paystack request is made,
  - the order is created successfully,
  - the order is marked as paid or free-completed,
  - coupon usage is recorded.
- Test a partial coupon and confirm Paystack still receives a non-zero amount.
- Test a no-discount checkout to ensure the normal payment flow is unchanged.
- Check logs for any remaining `invalid amount` errors from Paystack.

**Decision**
- Recommended: support free orders by bypassing Paystack for zero totals.
- Alternate option: block 100% coupons at checkout, but that would remove a valid promotional capability.
