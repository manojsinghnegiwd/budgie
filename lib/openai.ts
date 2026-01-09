import OpenAI from "openai";
import type { InsightData } from "@/app/actions/insights";

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Semantic search will not work.");
}

// Initialize OpenAI client
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Model to use for embeddings (1536 dimensions)
export const EMBEDDING_MODEL = "text-embedding-3-small";

// Model to use for insights
const INSIGHT_MODEL = "gpt-4o-mini";

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY && !!openai;
}

/**
 * Format currency for display in insights
 */
function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Identify insight subtype based on data properties
 */
function getInsightSubtype(data: InsightData): string {
  if (data.spent !== undefined && data.daysElapsed !== undefined) {
    return "pace_alert";
  }
  if (data.anomalies !== undefined) {
    return "anomaly_detection";
  }
  if (data.currentSpending !== undefined && data.lastMonthSameDay !== undefined) {
    return "month_over_month";
  }
  if (data.insights !== undefined) {
    return "category_insights";
  }
  if (data.currentTotal !== undefined && data.previousTotal !== undefined) {
    return "monthly_comparison";
  }
  if (data.predictedSpending !== undefined) {
    return "start_month";
  }
  return data.type; // Fallback to the InsightType
}

/**
 * Generate template-based insight text (fallback when OpenAI is unavailable)
 */
function generateTemplateInsight(data: InsightData): string {
  const subtype = getInsightSubtype(data);
  switch (subtype) {
    case "start_month":
      if (data.isOverBudget) {
        return `Based on your last 3 months, you're predicted to spend ${formatCurrency(data.predictedSpending)} this month—${formatCurrency(data.difference)} over your budget of ${formatCurrency(data.budget)}.`;
      } else {
        return `Based on your last 3 months, you're predicted to spend ${formatCurrency(data.predictedSpending)} this month. You should have a ${formatCurrency(data.difference)} cushion in your ${formatCurrency(data.budget)} budget.`;
      }
    
    case "pace_alert":
      if (data.isOverBudget) {
        return `You're on track to spend ${formatCurrency(data.projectedTotal)} by month-end—${formatCurrency(data.overBy)} over budget. Try keeping daily spending under ${formatCurrency(data.dailyTarget)} for the next ${data.daysRemaining} days.`;
      } else {
        return `You're on track! At your current pace, you'll spend ${formatCurrency(data.projectedTotal)} this month, staying ${formatCurrency(data.overBy)} under your ${formatCurrency(data.budget)} budget.`;
      }
    
    case "anomaly_detection":
      if (data.topAnomaly) {
        const anomaly = data.topAnomaly;
        if (anomaly.isHigher) {
          return `${anomaly.category} spending is ${Math.round(anomaly.deviation)}% higher than usual. You're on track to spend ${formatCurrency(anomaly.projected)} vs your typical ${formatCurrency(anomaly.average)}.`;
        } else {
          return `Great job! ${anomaly.category} spending is ${Math.round(Math.abs(anomaly.deviation))}% lower than usual. You're tracking at ${formatCurrency(anomaly.projected)} vs your typical ${formatCurrency(anomaly.average)}.`;
        }
      }
      return "Your spending patterns look normal this month.";
    
    case "month_over_month":
      if (data.isAhead) {
        return `You're ${formatCurrency(data.difference)} ahead of last month at this point—${Math.round(data.percentChange)}% less. Keep up the good work!`;
      } else {
        return `You've spent ${formatCurrency(data.difference)} more than this time last month—${Math.round(data.percentChange)}% higher. Watch your spending to stay on track.`;
      }
    
    case "category_insights":
      if (data.topInsight) {
        const insight = data.topInsight;
        switch (insight.type) {
          case "stable":
            return `${insight.category} is your most predictable expense at around ${formatCurrency(insight.value || 0)}/month—no surprises here!`;
          case "volatile":
            return `${insight.category} varies significantly month-to-month. Consider setting a buffer to avoid budget surprises.`;
          case "approaching_limit":
            return `${insight.category} is at ${Math.round(insight.value || 0)}% of its budget limit. Watch this category closely to avoid going over.`;
          case "trending_up":
            return `${insight.category} has increased ${Math.round(insight.value || 0)}% over the last few months. This might be worth reviewing.`;
        }
      }
      return "Your category spending looks balanced this month.";
    
    case "monthly_comparison":
      if (data.isLower) {
        const savings = data.biggestSavings;
        return `You spent ${formatCurrency(data.difference)} less than last month—${Math.round(data.percentChange)}% down. ${savings ? `Biggest savings: ${savings.name} (${formatCurrency(Math.abs(savings.change))})` : ''}`;
      } else {
        const increase = data.biggestIncrease;
        return `You spent ${formatCurrency(data.difference)} more than last month—${Math.round(data.percentChange)}% up. ${increase ? `Biggest increase: ${increase.name} (${formatCurrency(increase.change)})` : ''}`;
      }
    
    default:
      return "Your spending insights are being analyzed.";
  }
}

/**
 * Generate AI-powered insight text
 */
export async function generateInsightText(data: InsightData): Promise<string> {
  // If OpenAI is not available, use template
  if (!isOpenAIAvailable()) {
    return generateTemplateInsight(data);
  }

  try {
    let prompt = "";
    const subtype = getInsightSubtype(data);
    
    switch (subtype) {
      case "start_month":
        prompt = `Write a friendly, conversational 1-2 sentence insight about monthly spending prediction. 
Predicted spending: ${formatCurrency(data.predictedSpending)}
Budget: ${formatCurrency(data.budget)}
${data.isOverBudget ? `Over budget by: ${formatCurrency(data.difference)}` : `Under budget by: ${formatCurrency(data.difference)}`}
Keep it positive and actionable. Use the ₹ symbol for amounts.`;
        break;
      
      case "pace_alert":
        prompt = `Write a friendly 1-2 sentence insight about spending pace.
Current spending: ${formatCurrency(data.spent)} in ${data.daysElapsed} days
Projected total: ${formatCurrency(data.projectedTotal)}
Budget: ${formatCurrency(data.budget)}
${data.isOverBudget ? `Will be over by: ${formatCurrency(data.overBy)}. Suggest daily target: ${formatCurrency(data.dailyTarget)} for next ${data.daysRemaining} days` : `Will be under by: ${formatCurrency(data.overBy)}`}
${data.isOverBudget ? 'Provide actionable advice.' : 'Provide encouragement.'}`;
        break;
      
      case "anomaly_detection":
        if (data.topAnomaly) {
          const anomaly = data.topAnomaly;
          prompt = `Write a friendly 1-2 sentence insight about category spending anomaly.
Category: ${anomaly.category}
${anomaly.isHigher ? 'Spending is higher than usual' : 'Spending is lower than usual'}
Projected: ${formatCurrency(anomaly.projected)}
Typical average: ${formatCurrency(anomaly.average)}
Deviation: ${Math.round(anomaly.deviation)}%
${anomaly.isHigher ? 'Provide gentle heads-up.' : 'Provide encouragement.'}`;
        } else {
          return generateTemplateInsight(data);
        }
        break;
      
      case "month_over_month":
        prompt = `Write a friendly 1-2 sentence insight comparing spending to last month.
Current spending: ${formatCurrency(data.currentSpending)}
Last month same day: ${formatCurrency(data.lastMonthSameDay)}
${data.isAhead ? `Spending less by: ${formatCurrency(data.difference)} (${Math.round(data.percentChange)}% down)` : `Spending more by: ${formatCurrency(data.difference)} (${Math.round(data.percentChange)}% up)`}
${data.isAhead ? 'Provide encouragement.' : 'Provide gentle reminder to stay on track.'}`;
        break;
      
      case "category_insights":
        if (data.topInsight) {
          const insight = data.topInsight;
          prompt = `Write a friendly 1-2 sentence insight about category pattern.
Category: ${insight.category}
Type: ${insight.type}
Message: ${insight.message}
Make it informative and actionable.`;
        } else {
          return generateTemplateInsight(data);
        }
        break;
      
      case "monthly_comparison":
        const changeType = data.biggestSavings || data.biggestIncrease;
        prompt = `Write a friendly 1-2 sentence monthly comparison insight.
This month: ${formatCurrency(data.currentTotal)}
Last month: ${formatCurrency(data.previousTotal)}
${data.isLower ? `Spent less by: ${formatCurrency(data.difference)} (${Math.round(data.percentChange)}% down)` : `Spent more by: ${formatCurrency(data.difference)} (${Math.round(data.percentChange)}% up)`}
${changeType ? `Biggest change: ${changeType.name} (${formatCurrency(Math.abs(changeType.change))})` : ''}
${data.isLower ? 'Celebrate the achievement.' : 'Provide context and encouragement.'}`;
        break;
      
      default:
        return generateTemplateInsight(data);
    }

    const completion = await openai!.chat.completions.create({
      model: INSIGHT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a friendly financial advisor providing insights on personal spending. Be conversational, encouraging, and actionable. Keep insights to 1-2 sentences maximum. Use ₹ for currency.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    
    if (!text) {
      return generateTemplateInsight(data);
    }

    return text;
  } catch (error) {
    console.error("Error generating AI insight text:", error);
    return generateTemplateInsight(data);
  }
}

