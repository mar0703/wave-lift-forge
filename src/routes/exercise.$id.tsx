import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, SectionTitle } from "@/components/Page";
import { EXERCISE_CATALOG, getExerciseById } from "@/lib/exercise-catalog";
import { useEngine } from "@/lib/engine-store";

export const Route = createFileRoute("/exercise/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Iron Method` },
      { name: "description", content: `Details, phases and fixes for ${params.id} in Olympic weightlifting.` },
    ],
  }),
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { id } = Route.useParams();
  const { workout } = useEngine();
  // Try direct id, then by slugified name
  const cat =
    getExerciseById(id) ??
    EXERCISE_CATALOG.find((e) => e.name.toLowerCase().replace(/\s|&/g, "_") === id);

  const block = workout?.exercises.find(
    (e) => e.exercise.toLowerCase().replace(/\s|&/g, "_") === id || e.exercise.toLowerCase() === cat?.name.toLowerCase(),
  );

  if (!cat) {
    return (
      <Page title="Exercise" subtitle="Not found">
        <p className="text-sm text-muted-foreground">No exercise with id "{id}".</p>
        <Link to="/" className="text-primary text-xs uppercase tracking-widest">← back home</Link>
      </Page>
    );
  }

  return (
    <Page title={cat.name} subtitle={`${cat.group} · ${cat.type}`}>
      {block && (
        <section className="rounded-lg border border-border bg-card p-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-black text-primary">{block.weight_kg}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">kg</div>
          </div>
          <div>
            <div className="text-2xl font-black">{block.sets}×{block.reps}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">sets</div>
          </div>
          <div>
            <div className="text-2xl font-black">{block.intensity_pct}%</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">intensity</div>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <SectionTitle>Phases</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {cat.phases.map((p) => (
            <span key={p} className="text-[10px] uppercase tracking-wide bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {p}
            </span>
          ))}
        </div>
      </section>

      {cat.fixes && cat.fixes.length > 0 && (
        <section className="space-y-2">
          <SectionTitle>Targets / fixes</SectionTitle>
          <ul className="space-y-1">
            {cat.fixes.map((f) => (
              <li key={f} className="text-sm">· {f.replace(/_/g, " ")}</li>
            ))}
          </ul>
        </section>
      )}

      <Link to="/workout" className="block text-center text-xs uppercase tracking-widest text-primary">
        ← back to workout
      </Link>
    </Page>
  );
}
