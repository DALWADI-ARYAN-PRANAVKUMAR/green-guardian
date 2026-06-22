import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Filter, TrendingDown, Compass, Bike, Beef, Drumstick, Fish, Salad, Leaf,
  Car, Plane, Bus, TramFront, Zap, Plug, Flame, Droplets, Coffee, Shirt, Package,
  Trash2, Recycle, Trash,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar, MobileTopBar, MobileBottomNav } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { listActivities, deleteActivity } from "@/lib/activities.functions";
import { CATEGORY_META, type Category } from "@/lib/emissions";

export const Route = createFileRoute("/_authenticated/log")({
  head: () => ({ meta: [{ title: "Activity Log — Green Guardian" }] }),
  component: ActivityLog,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Zap, Bus, TramFront, Plane, Bike, Beef, Drumstick, Fish, Salad, Leaf, Coffee,
  Plug, Flame, Droplets, Shirt, Package, Trash2, Recycle,
};

const CAT_FILTERS: Array<{ id: "all" | Category; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: "all", label: "All Categories", Icon: Filter },
  { id: "transport", label: "Transport", Icon: Bus },
  { id: "food", label: "Dietary", Icon: Salad },
  { id: "energy", label: "Energy", Icon: Zap },
  { id: "shopping", label: "Shopping", Icon: Package },
  { id: "waste", label: "Waste", Icon: Recycle },
];

const CAT_BG: Record<Category, string> = {
  transport: "bg-tertiary-container text-on-tertiary-container",
  food: "bg-secondary-container text-on-secondary-container",
  energy: "bg-primary-container text-on-primary-container",
  shopping: "bg-surface-container-high text-primary",
  waste: "bg-error-container/50 text-destructive",
};

function ActivityLog() {
  const qc = useQueryClient();
  const listFn = useServerFn(listActivities);
  const delFn = useServerFn(deleteActivity);
  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: () => listFn({ data: undefined }) });
  const [filter, setFilter] = useState<"all" | Category>("all");

  const filtered = useMemo(
    () => activities.filter((a) => filter === "all" || a.category === filter),
    [activities, filter]
  );

  const monthCutoff = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const monthKg = activities.filter((a) => a.occurred_at >= monthCutoff).reduce((s, a) => s + Number(a.kg_co2e), 0);
  const prevMonthCutoff = new Date(Date.now() - 59 * 86400000).toISOString().slice(0, 10);
  const prevMonthKg = activities.filter((a) => a.occurred_at >= prevMonthCutoff && a.occurred_at < monthCutoff).reduce((s, a) => s + Number(a.kg_co2e), 0);
  const trend = prevMonthKg > 0 ? Math.round(((prevMonthKg - monthKg) / prevMonthKg) * 100) : 0;

  const streak = computeStreak(activities);
  const treesEquiv = (monthKg / 21).toFixed(1); // 21 kg CO2 per tree per year (approx)

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities"] }); toast.success("Removed"); },
  });

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <MobileTopBar title="Activity Log" />
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
              <p className="text-on-surface-variant">Detailed breakdown of your environmental actions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CAT_FILTERS.map((c) => {
                const active = filter === c.id;
                return (
                  <button key={c.id} onClick={() => setFilter(c.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground" : "bg-surface-container-high text-on-surface-variant hover:bg-secondary-container"}`}>
                    <c.Icon className="size-4" /> {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Hero summary */}
              <div className="relative overflow-hidden p-6 rounded-xl bg-primary text-primary-foreground flex items-center justify-between">
                <div className="relative z-10">
                  <p className="text-tertiary-fixed-dim text-xs uppercase tracking-widest font-bold">Total Last 30 Days</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-bold">{monthKg.toFixed(1)}</span>
                    <span className="text-xl opacity-80">kg CO₂e</span>
                  </div>
                  {trend !== 0 && (
                    <div className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${trend > 0 ? "text-tertiary-fixed-dim" : "text-warn"}`}>
                      <TrendingDown className={`size-4 ${trend < 0 ? "rotate-180" : ""}`} />
                      <span>{Math.abs(trend)}% {trend > 0 ? "better" : "more"} than previous 30 days</span>
                    </div>
                  )}
                </div>
                <Leaf className="hidden sm:block size-40 text-white opacity-10 absolute right-[-20px] top-[-20px]" />
              </div>

              {/* Table */}
              <div className="bg-card border border-outline-variant rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container border-b border-outline-variant text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                  <div className="col-span-7">Action &amp; Description</div>
                  <div className="col-span-2 text-right">CO₂</div>
                  <div className="col-span-3 text-right">Date</div>
                </div>
                {filtered.length === 0 ? (
                  <div className="px-6 py-16 text-center text-on-surface-variant">
                    No activities match this filter yet.
                  </div>
                ) : (
                  filtered.map((a) => {
                    const cat = a.category as Category;
                    const Icon = iconForAction(a.action);
                    return (
                      <div key={a.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/60 items-center hover:bg-surface-bright transition group">
                        <div className="col-span-7 flex items-start gap-4">
                          <div className={`p-2.5 rounded-lg shrink-0 ${CAT_BG[cat]}`}>
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground group-hover:text-primary transition">{a.action}</p>
                            <p className="text-xs text-on-surface-variant">
                              {a.quantity} {a.unit} · {CATEGORY_META[cat]?.label ?? a.category}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-primary">
                          {Number(a.kg_co2e).toFixed(2)} kg
                        </div>
                        <div className="col-span-3 text-right flex items-center justify-end gap-3">
                          <div>
                            <p className="text-xs text-foreground leading-none">{new Date(a.occurred_at).toLocaleDateString()}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold uppercase">Logged</span>
                          </div>
                          <button onClick={() => delMut.mutate(a.id)} aria-label="Delete" className="text-on-surface-variant hover:text-destructive p-1.5 rounded opacity-0 group-hover:opacity-100 transition">
                            <Trash className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar metrics */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-card border border-outline-variant p-6 rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">Ecosystem Health</h3>
                <div className="space-y-5">
                  <Meter label="Carbon Budget Used (30d)" value={`${Math.min(100, Math.round((monthKg / 165) * 100))}%`} pct={Math.min(100, (monthKg / 165) * 100)} hint={`Paris-aligned monthly budget is ~165 kg.`} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Stat label="Trees Equivalent" value={treesEquiv} />
                  <Stat label="Logging Streak" value={`${streak} days`} />
                </div>
              </section>

              <section className="bg-surface-container-low border border-outline-variant p-6 rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-3">Quick Habits</h3>
                <div className="space-y-2">
                  {[
                    { label: "Bring Reusable Cup", done: true, hint: "Daily" },
                    { label: "Unplug Idle Electronics", done: false, hint: "Daily" },
                    { label: "Cold Water Laundry", done: true, hint: "Weekly" },
                  ].map((h) => (
                    <div key={h.label} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-outline-variant">
                      <span className={`size-5 rounded-full grid place-items-center ${h.done ? "bg-on-tertiary-container text-white" : "border-2 border-outline"}`}>
                        {h.done && <span className="text-[10px]">✓</span>}
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{h.label}</p>
                        <p className="text-[10px] text-on-surface-variant">{h.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 bg-tertiary-fixed rounded-lg flex gap-3">
                  <Compass className="size-5 text-tertiary shrink-0" />
                  <p className="text-xs text-tertiary font-medium leading-relaxed">
                    Take the stairs instead of the elevator today to save ~0.2kg CO₂ and boost your health.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </main>
    </div>
  );
}

function iconForAction(action: string): React.ComponentType<{ className?: string }> {
  const a = action.toLowerCase();
  if (a.includes("beef")) return Beef;
  if (a.includes("chicken") || a.includes("pork")) return Drumstick;
  if (a.includes("fish")) return Fish;
  if (a.includes("vegan") || a.includes("vegetarian")) return Salad;
  if (a.includes("coffee")) return Coffee;
  if (a.includes("electric car")) return Zap;
  if (a.includes("car")) return Car;
  if (a.includes("flight")) return Plane;
  if (a.includes("train")) return TramFront;
  if (a.includes("bus")) return Bus;
  if (a.includes("cycl") || a.includes("bike")) return Bike;
  if (a.includes("electric")) return Plug;
  if (a.includes("gas")) return Flame;
  if (a.includes("shower")) return Droplets;
  if (a.includes("cloth")) return Shirt;
  if (a.includes("order") || a.includes("deliv")) return Package;
  if (a.includes("recycl")) return Recycle;
  if (a.includes("waste") || a.includes("landfill")) return Trash;
  return Leaf;
}

function computeStreak(activities: Array<{ occurred_at: string }>): number {
  if (activities.length === 0) return 0;
  const days = new Set(activities.map((a) => a.occurred_at));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    if (days.has(d)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function Meter({ label, value, pct, hint }: { label: string; value: string; pct: number; hint?: string }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-sm text-on-surface-variant">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
        <div className="h-full bg-tertiary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {hint && <p className="text-[11px] text-on-surface-variant mt-1.5 italic">{hint}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant">
      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{label}</p>
      <p className="text-xl font-bold text-primary mt-0.5">{value}</p>
    </div>
  );
}
