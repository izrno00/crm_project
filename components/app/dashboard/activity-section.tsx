import { ActivityChart } from "@/components/app/dashboard/activity-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay } from "@/lib/format";
import { getInquiryActivity } from "@/lib/queries/dashboard";
import { en } from "@/lib/strings/en";

const t = en.dashboard.chart;

// Inquiries received per day over the last 30 days (DASH-2).
export async function ActivitySection() {
  const days = await getInquiryActivity();
  const total = days.reduce((sum, day) => sum + day.inquiries, 0);
  const data = days.map((day) => ({
    day: day.day,
    label: formatDay(day.day),
    inquiries: day.inquiries,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityChart data={data} summary={`${t.description}. ${t.summary(total)}`} />
      </CardContent>
    </Card>
  );
}
