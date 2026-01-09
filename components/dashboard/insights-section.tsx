import { getInsight } from "@/app/actions/insights";
import { InsightsCard } from "@/components/insights-card";

interface InsightsSectionProps {
  month: number;
  year: number;
  viewUserId: string | null;
  categoryIds: string[] | null;
}

export async function InsightsSection({ 
  month, 
  year, 
  viewUserId, 
  categoryIds 
}: InsightsSectionProps) {
  const insight = await getInsight(viewUserId, month, year, categoryIds);
  
  // Don't render anything if no insight is available
  if (!insight) {
    return null;
  }

  return <InsightsCard insight={insight} />;
}

