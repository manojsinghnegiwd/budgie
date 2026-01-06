import { NextRequest, NextResponse } from "next/server";
import {
  sendDailyLogReminder,
  sendUpcomingExpenseReminders,
} from "@/app/actions/notifications";

/**
 * Vercel Cron Job endpoint for daily notifications
 * Runs daily at 10 PM IST (16:30 UTC)
 * 
 * Security: Vercel automatically sends CRON_SECRET in Authorization header
 * We verify this to ensure only Vercel can trigger this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Send daily log reminder to all subscribed users
    const logReminderResult = await sendDailyLogReminder();
    console.log("Daily log reminder sent:", logReminderResult);

    // Send reminders for upcoming expenses (due tomorrow)
    const upcomingRemindersResult = await sendUpcomingExpenseReminders();
    console.log("Upcoming expense reminders sent:", upcomingRemindersResult);

    return NextResponse.json({
      success: true,
      logReminder: logReminderResult,
      upcomingReminders: upcomingRemindersResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in daily notifications cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}


