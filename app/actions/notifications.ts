"use server";

import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Set VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:budgie@example.com", // This should be your contact email
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function subscribeUser(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userId?: string
) {
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId || null,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error subscribing user:", error);
    return { success: false, error: "Failed to save subscription" };
  }
}

export async function unsubscribeUser(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    });

    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    return { success: false, error: "Failed to remove subscription" };
  }
}

export async function sendNotification(
  title: string,
  body: string,
  options?: {
    userId?: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
  }
) {
  try {
    const where: any = {};
    if (options?.userId) {
      where.userId = options.userId;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where,
    });

    if (subscriptions.length === 0) {
      return { success: false, error: "No subscriptions found" };
    }

    const payload = JSON.stringify({
      title,
      body,
      url: options?.url || "/",
      tag: options?.tag || "budgie-notification",
      requireInteraction: options?.requireInteraction || false,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(subscription, payload);
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Remove failed subscriptions (likely expired)
    const failedSubscriptions = subscriptions.filter((_, index) => {
      const result = results[index];
      return result.status === "rejected";
    });

    if (failedSubscriptions.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: {
            in: failedSubscriptions.map((s) => s.endpoint),
          },
        },
      });
    }

    return {
      success: true,
      sent: successful,
      failed,
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Get upcoming expenses due within the specified number of days
 */
export async function getUpcomingExpenses(daysAhead: number = 1) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  targetDate.setHours(0, 0, 0, 0);
  const targetDateEnd = new Date(targetDate);
  targetDateEnd.setHours(23, 59, 59, 999);

  const upcomingExpenses = await prisma.expense.findMany({
    where: {
      type: { in: ["recurring", "reminder"] },
      isProjected: true,
      date: {
        gte: targetDate,
        lte: targetDateEnd,
      },
    },
    include: {
      user: true,
      category: true,
    },
  });

  return upcomingExpenses;
}

/**
 * Send daily reminder to all subscribed users to log their expenses
 */
export async function sendDailyLogReminder() {
  return await sendNotification(
    "Time to log expenses!",
    "Don't forget to record today's spending in Budgie",
    {
      url: "/expenses",
      tag: "daily-log-reminder",
    }
  );
}

/**
 * Send reminders for upcoming recurring and reminder expenses
 */
export async function sendUpcomingExpenseReminders() {
  const upcomingExpenses = await getUpcomingExpenses(1); // 1 day ahead

  if (upcomingExpenses.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  // Group expenses by user
  const expensesByUser = new Map<string, typeof upcomingExpenses>();
  for (const expense of upcomingExpenses) {
    if (!expensesByUser.has(expense.userId)) {
      expensesByUser.set(expense.userId, []);
    }
    expensesByUser.get(expense.userId)!.push(expense);
  }

  // Send notifications to each user
  const results = await Promise.allSettled(
    Array.from(expensesByUser.entries()).map(async ([userId, expenses]) => {
      // If user has multiple expenses, send a summary notification
      if (expenses.length > 1) {
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        return await sendNotification(
          "Bills Due Tomorrow",
          `You have ${expenses.length} bills totaling Rs. ${totalAmount.toFixed(2)} due tomorrow`,
          {
            userId,
            url: "/expenses",
            tag: "upcoming-expenses",
          }
        );
      } else {
        // Single expense - send specific notification
        const expense = expenses[0];
        return await sendNotification(
          "Bill Due Tomorrow",
          `${expense.description} - Rs. ${expense.amount.toFixed(2)} due tomorrow`,
          {
            userId,
            url: "/expenses",
            tag: "upcoming-expense",
          }
        );
      }
    })
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return {
    success: true,
    sent: successful,
    failed,
    totalExpenses: upcomingExpenses.length,
  };
}

