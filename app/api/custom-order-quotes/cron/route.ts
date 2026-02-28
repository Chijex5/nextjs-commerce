import { NextRequest, NextResponse } from "next/server";
import {
  and,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
} from "drizzle-orm";
import { db } from "lib/db";
import {
  customOrderQuoteTokens,
  customOrderQuotes,
  customOrderRequests,
} from "lib/db/schema";
import {
  buildCustomOrderPublicToken,
  buildCustomRequestTrackUrl,
  buildQuoteAccessUrl,
  hashCustomOrderPublicToken,
  isCustomOrderFeatureEnabled,
} from "lib/custom-order-utils";
import {
  sendCustomOrderQuoteExpiredNotice,
  sendCustomOrderQuoteReminder,
} from "lib/email/order-emails";

const ACTIVE_QUOTE_STATUSES = ["sent", "accepted"] as const;

const parseThresholds = (raw: string | undefined) => {
  const parsed = (raw || "24,2")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a);
  return parsed.length ? parsed : [24, 2];
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function GET(request: NextRequest) {
  try {
    if (!isCustomOrderFeatureEnabled()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = request.headers.get("x-cron-secret");
    if (!cronSecret || requestSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const reminderThresholds = parseThresholds(
      process.env.CUSTOM_ORDER_QUOTE_REMINDER_THRESHOLDS_HOURS,
    );
    const autoCancelDelayHours = Math.max(
      0,
      parseNumber(process.env.CUSTOM_ORDER_QUOTE_AUTO_CANCEL_AFTER_HOURS, 0),
    );
    const cleanupAfterDays = Math.max(
      1,
      parseNumber(process.env.CUSTOM_ORDER_QUOTE_CLEANUP_AFTER_DAYS, 30),
    );
    const maxBatch = Math.max(
      10,
      Math.min(
        500,
        parseNumber(process.env.CUSTOM_ORDER_QUOTE_CRON_BATCH_SIZE, 100),
      ),
    );

    const quoteRows = await db
      .select({
        quoteId: customOrderQuotes.id,
        quoteVersion: customOrderQuotes.version,
        quoteStatus: customOrderQuotes.status,
        amount: customOrderQuotes.amount,
        currencyCode: customOrderQuotes.currencyCode,
        expiresAt: customOrderQuotes.expiresAt,
        reminderCount: customOrderQuotes.reminderCount,
        expiredNotificationSentAt: customOrderQuotes.expiredNotificationSentAt,
        requestId: customOrderRequests.id,
        requestNumber: customOrderRequests.requestNumber,
        requestStatus: customOrderRequests.status,
        requestTitle: customOrderRequests.title,
        requestEmail: customOrderRequests.email,
        customerName: customOrderRequests.customerName,
        convertedOrderId: customOrderRequests.convertedOrderId,
      })
      .from(customOrderQuotes)
      .innerJoin(
        customOrderRequests,
        eq(customOrderRequests.id, customOrderQuotes.requestId),
      )
      .where(
        and(
          inArray(customOrderQuotes.status, [...ACTIVE_QUOTE_STATUSES]),
          isNotNull(customOrderQuotes.expiresAt),
        ),
      )
      .limit(maxBatch);

    const latestQuoteByRequest = new Map<
      string,
      { quoteId: string; version: number }
    >();
    for (const row of quoteRows) {
      const existing = latestQuoteByRequest.get(row.requestId);
      if (!existing || row.quoteVersion > existing.version) {
        latestQuoteByRequest.set(row.requestId, {
          quoteId: row.quoteId,
          version: row.quoteVersion,
        });
      }
    }

    let remindersSent = 0;
    let quotesCancelled = 0;
    let cleanupDeleted = 0;
    const errors: string[] = [];

    for (const row of quoteRows) {
      const expiresAt = row.expiresAt ? new Date(row.expiresAt) : null;
      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        continue;
      }

      if (row.requestStatus === "paid" || row.convertedOrderId) {
        continue;
      }

      const msUntilExpiry = expiresAt.getTime() - now.getTime();
      const reminderIndex = Math.max(0, row.reminderCount || 0);
      const latestForRequest = latestQuoteByRequest.get(row.requestId);
      const isLatestActiveQuote = latestForRequest?.quoteId === row.quoteId;

      if (!isLatestActiveQuote) {
        if (msUntilExpiry <= 0) {
          try {
            await db
              .update(customOrderQuotes)
              .set({
                status: "expired",
                updatedAt: now,
              })
              .where(eq(customOrderQuotes.id, row.quoteId));
          } catch (error) {
            errors.push(
              `expire-old ${row.requestNumber}: ${(error as Error).message}`,
            );
          }
        }
        continue;
      }

      if (msUntilExpiry > 0) {
        if (reminderIndex >= reminderThresholds.length) {
          continue;
        }

        const thresholdHours = reminderThresholds[reminderIndex];
        if (thresholdHours === undefined) {
          continue;
        }
        if (msUntilExpiry > thresholdHours * 60 * 60 * 1000) {
          continue;
        }

        try {
          const publicToken = buildCustomOrderPublicToken();
          const tokenHash = hashCustomOrderPublicToken(publicToken);
          await db.insert(customOrderQuoteTokens).values({
            quoteId: row.quoteId,
            email: row.requestEmail,
            tokenHash,
            expiresAt,
          });

          const quoteUrl = buildQuoteAccessUrl(row.quoteId, publicToken);
          await sendCustomOrderQuoteReminder({
            to: row.requestEmail,
            customerName: row.customerName,
            requestNumber: row.requestNumber,
            amount: Number(row.amount),
            currencyCode: row.currencyCode,
            expiresAt: expiresAt.toISOString(),
            quoteUrl,
            reminderNumber: reminderIndex + 1,
            totalReminders: reminderThresholds.length,
          });

          await db
            .update(customOrderQuotes)
            .set({
              reminderCount: reminderIndex + 1,
              lastReminderAt: now,
              updatedAt: now,
            })
            .where(eq(customOrderQuotes.id, row.quoteId));

          remindersSent++;
        } catch (error) {
          errors.push(
            `reminder ${row.requestNumber}: ${(error as Error).message}`,
          );
        }
        continue;
      }

      if (msUntilExpiry > -(autoCancelDelayHours * 60 * 60 * 1000)) {
        continue;
      }

      try {
        await db.transaction(async (tx) => {
          await tx
            .update(customOrderQuotes)
            .set({
              status: "expired",
              updatedAt: now,
            })
            .where(eq(customOrderQuotes.id, row.quoteId));

          await tx
            .update(customOrderRequests)
            .set({
              status: "cancelled",
              updatedAt: now,
            })
            .where(
              and(
                eq(customOrderRequests.id, row.requestId),
                ne(customOrderRequests.status, "paid"),
                isNull(customOrderRequests.convertedOrderId),
              ),
            );
        });

        if (!row.expiredNotificationSentAt) {
          const trackUrl = buildCustomRequestTrackUrl(
            row.requestNumber,
            row.requestEmail,
          );
          await sendCustomOrderQuoteExpiredNotice({
            to: row.requestEmail,
            customerName: row.customerName,
            requestNumber: row.requestNumber,
            trackUrl,
            cleanupAfterDays,
          });
        }

        await db
          .update(customOrderQuotes)
          .set({
            expiredNotificationSentAt:
              row.expiredNotificationSentAt || new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customOrderQuotes.id, row.quoteId));

        quotesCancelled++;
      } catch (error) {
        errors.push(`expire ${row.requestNumber}: ${(error as Error).message}`);
      }
    }

    const cleanupCutoff = new Date(
      now.getTime() - cleanupAfterDays * 24 * 60 * 60 * 1000,
    );
    const staleRequestRows = await db
      .select({ id: customOrderRequests.id })
      .from(customOrderRequests)
      .where(
        and(
          eq(customOrderRequests.status, "cancelled"),
          isNull(customOrderRequests.convertedOrderId),
          lte(customOrderRequests.updatedAt, cleanupCutoff),
        ),
      )
      .limit(maxBatch);

    if (staleRequestRows.length > 0) {
      const staleRequestIds = staleRequestRows.map((row) => row.id);
      const activeQuotesForStaleRequests = await db
        .select({ requestId: customOrderQuotes.requestId })
        .from(customOrderQuotes)
        .where(
          and(
            inArray(customOrderQuotes.requestId, staleRequestIds),
            inArray(customOrderQuotes.status, [...ACTIVE_QUOTE_STATUSES]),
            or(
              isNull(customOrderQuotes.expiresAt),
              gt(customOrderQuotes.expiresAt, now),
            ),
          ),
        );

      const activeRequestSet = new Set(
        activeQuotesForStaleRequests.map((row) => row.requestId),
      );
      const deletableIds = staleRequestIds.filter((id) => !activeRequestSet.has(id));

      if (deletableIds.length > 0) {
        await db
          .delete(customOrderRequests)
          .where(inArray(customOrderRequests.id, deletableIds));
        cleanupDeleted = deletableIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        reminderThresholds,
        autoCancelDelayHours,
        cleanupAfterDays,
        maxBatch,
      },
      scanned: quoteRows.length,
      remindersSent,
      quotesCancelled,
      cleanupDeleted,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("Failed to process custom quote cron:", error);
    return NextResponse.json(
      { error: "Failed to process custom quote cron" },
      { status: 500 },
    );
  }
}
