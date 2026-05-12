import { Link } from "@tanstack/react-router";
import { Dumbbell, LayoutGrid, CalendarDays, BarChart3, User, ClipboardCheck } from "lucide-react";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const t = useT();
  const items = [
    { to: "/", label: t("today"), icon: LayoutGrid },
    { to: "/onboarding", label: t("onboarding_title"), icon: ClipboardCheck },
    { to: "/workout", label: t("workout"), icon: Dumbbell },
    { to: "/microcycle", label: t("cycle"), icon: CalendarDays },
    { to: "/analytics", label: t("stats"), icon: BarChart3 },
    { to: "/profile", label: t("profile"), icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="max-w-md mx-auto grid grid-cols-6">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
