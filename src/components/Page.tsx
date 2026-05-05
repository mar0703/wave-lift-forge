import { cn } from "@/lib/utils";

export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-xl font-black", tone)}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground pb-24">
      <header className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="text-3xl font-black tracking-tight uppercase">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        )}
      </header>
      <main className="px-5 py-6 space-y-6 max-w-md mx-auto">{children}</main>
    </div>
  );
}
