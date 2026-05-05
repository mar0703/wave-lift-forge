import { Link } from "@tanstack/react-router";
import { Dumbbell, LayoutGrid, CalendarDays, BarChart3, User } from "lucide-react";
import { useT } from "@/lib/useT";
import type { DictKey } from "@/lib/i18n";

const items = [
  { to: "/", labelKey: "today", icon: LayoutGrid },
  { to: "/workout", labelKey: "workout", icon: Dumbbell },
  { to: "/microcycle", labelKey: "cycle", icon: CalendarDays },
  { to: "/analytics", labelKey: "stats", icon: BarChart3 },
  { to: "/profile", labelKey: "profile", icon: User },
] as const;

export function BottomNav() {
  const t = useT();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="max-w-md mx-auto grid grid-cols-5">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <Icon className="h-5 w-5" />
              {t(labelKey as DictKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
