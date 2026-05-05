import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/engine-store";
import { Page, SectionTitle, Stat } from "@/components/Page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Iron Method" },
      { name: "description", content: "Track your session history, intensity trend and recovery." },
      { property: "og:title", content: "Training Analytics — Iron Method" },
      { property: "og:description", content: "See how intensity, RPE and success evolve over weeks." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { history, adaptation, input } = useEngine();
  const last = history[0];
  const avgRPE =
    history.length ? history.reduce((a, h) => a + h.average_RPE, 0) / history.length : 0;
  const avgSuccess =
    history.length ? history.reduce((a, h) => a + h.success_rate, 0) / history.length : 0;

  return (
    <Page title="Stats" subtitle="Performance">
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-3">
        <Stat label="Sessions" value={String(history.length)} />
        <Stat label="Avg RPE" value={avgRPE.toFixed(1)} tone="text-amber-400" />
        <Stat label="Success" value={`${Math.round(avgSuccess)}%`} tone="text-emerald-400" />
      </div>

      {adaptation && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-2">
          <SectionTitle>Engine recommendation</SectionTitle>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary">{adaptation.next_intensity_pct}%</span>
            <span className="text-xs text-muted-foreground">next session</span>
          </div>
          <div className="text-xs text-muted-foreground">Fatigue → {adaptation.new_fatigue_score} (was {input.fatigue_score})</div>
          <ul className="pt-2 space-y-1">
            {adaptation.adjustments.map((a, i) => (
              <li key={i} className="text-xs text-muted-foreground">· {a}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <SectionTitle>Intensity trend</SectionTitle>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sessions yet — finish a workout to see data.</p>
        ) : (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-end justify-between gap-1 h-24">
              {history.slice(0, 10).reverse().map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-full rounded-t",
                      h.average_RPE > 8 ? "bg-red-500" : h.average_RPE > 6 ? "bg-amber-500" : "bg-emerald-500",
                    )}
                    style={{ height: `${h.adjusted_intensity}%` }}
                  />
                  <div className="text-[8px] text-muted-foreground">D{h.day}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {last && (
        <section className="space-y-2">
          <SectionTitle>Last session</SectionTitle>
          <div className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(last.date).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Day</span><span>{last.day}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Intensity</span><span>{last.adjusted_intensity}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sets</span><span>{last.total_sets}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RPE</span><span>{last.average_RPE}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Success</span><span>{last.success_rate}%</span></div>
          </div>
        </section>
      )}
    </Page>
  );
}
