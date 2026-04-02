import { Badge } from "@/components/ui/badge";

type TimelineItem = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: Date;
  user?: { name: string | null; email: string | null } | null;
  tenant?: { name: string } | null;
};

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="relative pl-6">
          <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="absolute left-1 top-4 h-[calc(100%+8px)] w-px bg-border last:hidden" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">
              {item.user?.name ?? item.user?.email ?? "System"}{" "}
              {item.action.toLowerCase()} {item.entity}
            </p>
            <Badge variant="outline">{item.action}</Badge>
            {item.tenant?.name ? (
              <Badge variant="outline">{item.tenant.name}</Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(item.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
