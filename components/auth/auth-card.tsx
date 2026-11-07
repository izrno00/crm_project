import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// The card every auth page renders its content in. Static: no session or request reads.
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        {/* CardTitle renders a div; give each auth page a real level-1 heading. */}
        <CardTitle role="heading" aria-level={1} className="font-heading text-2xl">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Placeholder shown while a page's request-time content streams in.
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-3xl bg-muted" />
        </div>
      ))}
      <div className="h-10 w-full animate-pulse rounded-4xl bg-muted" />
    </div>
  );
}
