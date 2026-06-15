import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, TrendingDown, TrendingUp, Lightbulb, ArrowRight, Calendar, Download,
  Car, Zap, Bus, TramFront, Plane, Bike, Beef, Drumstick, Fish, Salad, Leaf, Coffee,
  Plug, Flame, Droplets, Shirt, Package, Trash2, Recycle, Sparkles,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, Legend } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppSidebar, MobileTopBar, MobileBottomNav } from "@/components/app-sidebar";
import { listActivities, logActivity, getProfile, updateGoal } from "@/lib/activities.functions";
import { PRESETS, CATEGORY_META, computeKg, type Category } from "@/lib/emissions";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Zap, Bus, TramFront, Plane, Bike, Beef, Drumstick, Fish, Salad, Leaf, Coffee,
  Plug, Flame, Droplets, Shirt, Package, Trash2, Recycle,
};

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — EcoTrace" }] }),
  component: Dashboard,
});

const PARIS_TARGET = 5.5;
const todayStr = () => new Date().toISOString().slice(0, 10);

function Dashboard() {
  const listFn = useServerFn(listActivities);
  const profileFn = useServerFn(getProfile);

  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: () => listFn({ data: undefined }) });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined }) });
  const goal = Number(profile?.daily_goal_kg ?? 10);

  const today = todayStr();
  const todayKg = activities.filter((a) => a.occurred_at === today).reduce((s, a) => s + Number(a.kg_co2e), 0);
  const weekCutoff = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const weekKg = activities.filter((a) => a.occurred_at >= weekCutoff).reduce((s, a) => s + Number(a.kg_co2e), 0);
  const monthCutoff = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const monthKg = activities.filter((a) => a.occurred_at >= monthCutoff).reduce((s, a) => s + Number(a.kg_co2e), 0);

  // Efficiency score 0-100: lower kg vs goal => higher score
  const score = Math.max(0, Math.min(100, Math.round(100 - ((todayKg / Math.max(goal, 0.1)) * 50))));
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "On track" : score >= 40 ? "Watch" : "Action needed";

  const daily = useMemo(() => {
    const map = new Map<string, { energy: number; transport: number; food: number; total: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      map.set(d, { energy: 0, transport: 0, food: 0, total: 0 });
    }
    for (const a of activities) {
      if (a.occurred_at >= weekCutoff && map.has(a.occurred_at)) {
        const v = map.get(a.occurred_at)!;
        const kg = Number(a.kg_co2e);
        if (a.category === "energy") v.energy += kg;
        else if (a.category === "transport") v.transport += kg;
        else if (a.category === "food") v.food += kg;
        v.total += kg;
      }
    }
    return Array.from(map.entries()).map(([d, v]) => ({
      day: new Date(d).toLocaleDateString(undefined, { weekday: "short" }),
      energy: Math.round(v.energy * 10) / 10,
      transport: Math.round(v.transport * 10) / 10,
      food: Math.round(v.food * 10) / 10,
    }));
  }, [activities, weekCutoff]);

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of activities) if (a.occurred_at >= weekCutoff) map[a.category] = (map[a.category] ?? 0) + Number(a.kg_co2e);
    return Object.entries(map).map(([category, kg]) => ({
      category, label: CATEGORY_META[category as Category]?.label ?? category, kg: Math.round(kg * 10) / 10,
    })).sort((a, b) => b.kg - a.kg);
  }, [activities, weekCutoff]);

  const recent = activities.slice(0, 5);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <MobileTopBar title="Dashboard" />
        <header className="hidden lg:flex justify-between items-center px-10 h-20 sticky top-0 z-30 bg-surface-bright/95 backdrop-blur border-b border-outline-variant">
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold text-primary">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <LogActivityDialog />
            <GoalDialog current={goal} />
          </div>
        </header>

        <div className="p-6 lg:p-10 space-y-6 max-w-[1400px] mx-auto w-full">
          {/* Hero header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-on-tertiary-container uppercase tracking-widest mb-2">System Overview</p>
              <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">Your impact is blooming.</h2>
              <p className="mt-2 text-base text-on-surface-variant max-w-2xl">High-fidelity analysis of your footprint across energy, transport, and food choices over the past 30 days.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition">
                <Calendar className="size-4" /> Last 30 Days
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition">
                <Download className="size-4" /> Export
              </button>
            </div>
            <div className="lg:hidden">
              <LogActivityDialog />
            </div>
          </div>

          {/* Bento */}
          <div className="grid grid-cols-12 gap-6">
            {/* Carbon Summary chart */}
            <div className="col-span-12 lg:col-span-8 bg-card rounded-xl border border-outline-variant p-6 flex flex-col min-h-[420px]">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-xl font-bold text-primary">Carbon Summary</h3>
                  <p className="text-sm text-on-surface-variant">Aggregated kg CO₂e by source · last 7 days</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Legend2 color="var(--chart-1)" label="Energy" />
                  <Legend2 color="var(--chart-2)" label="Transport" />
                  <Legend2 color="var(--chart-3)" label="Food" />
                </div>
              </div>
              <div className="flex-1 min-h-[280px]">
                <ResponsiveContainer>
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={28} fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: 8 }} formatter={(v: number, n) => [`${v} kg`, n]} />
                    <Bar dataKey="energy" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="transport" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="food" stackId="a" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">7-day total</span>
                <span className="font-bold text-primary">{weekKg.toFixed(1)} kg CO₂e</span>
              </div>
            </div>

            {/* Efficiency Score */}
            <div className="col-span-12 lg:col-span-4 bg-primary-container rounded-xl p-6 text-white flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="text-xs font-bold text-on-primary-container uppercase tracking-widest mb-6">Efficiency Score</h3>
              <ScoreRing score={score} />
              <div className="text-center mt-4">
                <p className="text-sm opacity-90 mb-4 max-w-xs">
                  {score >= 80 ? "Top tier — your daily impact is well below target." : score >= 60 ? "Steady progress against your daily target." : "Today is trending above goal — small swaps will help."}
                </p>
                <div className="flex gap-3 justify-center">
                  <div className="bg-white/10 px-4 py-2 rounded-lg text-center">
                    <p className="text-[10px] opacity-70 uppercase">Today</p>
                    <p className="font-bold">{todayKg.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg text-center">
                    <p className="text-[10px] opacity-70 uppercase">Goal</p>
                    <p className="font-bold">{goal} kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activity table */}
            <div className="col-span-12 bg-card rounded-xl border border-outline-variant p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-xl font-bold text-primary">Recent Activity</h3>
                  <p className="text-sm text-on-surface-variant">Your latest logged actions</p>
                </div>
                <a href="/log" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="size-4" /></a>
              </div>
              {recent.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant">
                  <p>Nothing logged yet. Tap "Log Activity" to start.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Activity</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Impact</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">vs Goal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {recent.map((a) => {
                        const kg = Number(a.kg_co2e);
                        const ratio = kg / goal;
                        const isHigh = kg > goal;
                        return (
                          <tr key={a.id} className="hover:bg-surface-bright transition">
                            <td className="px-4 py-4 text-sm text-foreground">{new Date(a.occurred_at).toLocaleDateString()}</td>
                            <td className="px-4 py-4 font-semibold text-primary">{a.action}</td>
                            <td className="px-4 py-4"><CategoryPill cat={a.category as Category} /></td>
                            <td className={`px-4 py-4 font-mono font-bold text-right ${isHigh ? "text-destructive" : "text-primary"}`}>{kg.toFixed(2)} kg</td>
                            <td className="px-4 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 font-bold text-xs ${isHigh ? "text-destructive" : "text-on-tertiary-container"}`}>
                                {isHigh ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                {Math.round(ratio * 100)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Insight cards */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container rounded-xl p-6 flex flex-col justify-between group">
              <div>
                <span className="inline-grid place-items-center size-10 bg-card rounded-lg text-primary mb-3">
                  <Lightbulb className="size-5" />
                </span>
                <h4 className="text-lg font-bold text-primary mb-1">Smart Recommendation</h4>
                <p className="text-sm text-on-surface-variant">
                  {byCat[0] ? `Your biggest source this week is ${byCat[0].label.toLowerCase()} at ${byCat[0].kg} kg. Ask the AI coach for targeted swaps.` : "Log a few activities and we'll surface a personalized recommendation here."}
                </p>
              </div>
              <a href="/coach" className="mt-4 text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ask the coach <ArrowRight className="size-4" />
              </a>
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-card border border-outline-variant rounded-xl p-6">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Benchmark · 30 day</h4>
              <div className="space-y-3">
                <BenchmarkRow label="You" value={`${(monthKg).toFixed(0)} kg`} pct={Math.min(100, (monthKg / 375) * 100)} color="var(--primary)" />
                <BenchmarkRow label="Global average" value="375 kg" pct={100} color="var(--secondary)" />
                <BenchmarkRow label="Paris target" value="165 kg" pct={44} color="var(--chart-2)" />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-surface-container-high rounded-xl p-6 flex items-center gap-5">
              <div className="size-20 rounded-full border-4 border-primary p-2 grid place-items-center shrink-0">
                <Sparkles className="size-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-primary text-lg">{scoreLabel}</h4>
                <p className="text-sm text-on-surface-variant mt-1">{score}/100 efficiency · keep your daily logging streak going.</p>
              </div>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </main>
    </div>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      <span className="text-on-surface-variant">{label}</span>
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 88;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative size-48 grid place-items-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
        <circle cx="96" cy="96" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
        <circle cx="96" cy="96" r={r} fill="none" stroke="var(--tertiary-fixed)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold leading-none">{score}</span>
        <span className="text-xs text-on-primary-container mt-1">Efficiency</span>
      </div>
    </div>
  );
}

function BenchmarkRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const CAT_PILL: Record<Category, string> = {
  transport: "bg-secondary-container text-on-secondary-container",
  food: "bg-primary-container/10 text-primary",
  energy: "bg-tertiary-container/15 text-on-tertiary-container",
  shopping: "bg-surface-container-high text-foreground",
  waste: "bg-error-container/40 text-destructive",
};
function CategoryPill({ cat }: { cat: Category }) {
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${CAT_PILL[cat] ?? "bg-surface-container"}`}>{CATEGORY_META[cat]?.label ?? cat}</span>;
}

function LogActivityDialog() {
  const qc = useQueryClient();
  const logFn = useServerFn(logActivity);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Category>("transport");
  const [preset, setPreset] = useState<string>("");
  const [qty, setQty] = useState<string>("1");
  const [date, setDate] = useState(todayStr());

  const mut = useMutation({
    mutationFn: (d: { presetId: string; quantity: number; occurredAt: string }) => logFn({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Logged");
      setOpen(false); setPreset(""); setQty("1");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selected = PRESETS.find((p) => p.id === preset);
  const estimate = selected ? computeKg(selected.id, Number(qty) || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary-container gap-2 font-bold">
          <Plus className="size-4" /> Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-2xl font-bold text-primary">Log an activity</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v as Category); setPreset(""); }}>
          <TabsList className="grid grid-cols-5 w-full">
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs">{CATEGORY_META[c].label}</TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
            <TabsContent key={c} value={c} className="mt-4">
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-auto pr-1">
                {PRESETS.filter((p) => p.category === c).map((p) => {
                  const Icon = ICONS[p.icon] ?? Leaf;
                  const active = preset === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setPreset(p.id)}
                      className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left text-sm transition ${active ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/40"}`}>
                      <Icon className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{p.action}</span>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label htmlFor="qty">Quantity {selected ? `(${selected.unit})` : ""}</Label>
            <Input id="qty" type="number" min="0" step="0.1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 rounded-lg bg-surface-container px-4 py-3">
          <span className="text-sm text-on-surface-variant">Estimated impact</span>
          <span className="text-2xl font-bold text-primary">{estimate.toFixed(2)} <span className="text-xs font-normal">kg CO₂e</span></span>
        </div>

        <Button disabled={!selected || !qty || mut.isPending} onClick={() => selected && mut.mutate({ presetId: selected.id, quantity: Number(qty), occurredAt: date })}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary-container rounded-lg font-bold">
          {mut.isPending ? "Saving…" : "Add to log"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({ current }: { current: number }) {
  const qc = useQueryClient();
  const fn = useServerFn(updateGoal);
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(String(current));
  const mut = useMutation({
    mutationFn: (n: number) => fn({ data: { daily_goal_kg: n } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Goal updated"); setOpen(false); },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="h-10 rounded-xl border-outline-variant">Set Goal</Button></DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="text-xl font-bold text-primary">Daily goal</DialogTitle></DialogHeader>
        <p className="text-sm text-on-surface-variant">Paris-aligned target is ~{PARIS_TARGET} kg/day. Global average is ~12.5 kg.</p>
        <Label htmlFor="goal">kg CO₂e per day</Label>
        <Input id="goal" type="number" min="1" max="50" step="0.5" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button onClick={() => mut.mutate(Number(val))} disabled={mut.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary-container">Save</Button>
      </DialogContent>
    </Dialog>
  );
}
