import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sprout, MessageCircle, LogOut, Plus, Trash2, TrendingDown, Target,
  Car, Zap, Bus, TramFront, Plane, Bike, Beef, Drumstick, Fish, Salad, Leaf, Coffee,
  Plug, Flame, Droplets, Shirt, Package, Trash2 as Trash, Recycle,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { listActivities, logActivity, deleteActivity, getProfile, updateGoal } from "@/lib/activities.functions";
import { PRESETS, CATEGORY_META, computeKg, type Category } from "@/lib/emissions";
import logo from "@/assets/logo.png";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Zap, Bus, TramFront, Plane, Bike, Beef, Drumstick, Fish, Salad, Leaf, Coffee,
  Plug, Flame, Droplets, Shirt, Package, Trash2: Trash, Recycle,
};

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — Verdant" }] }),
  component: Dashboard,
});

const GLOBAL_AVG = 12.5;
const PARIS_TARGET = 5.5;
const todayStr = () => new Date().toISOString().slice(0, 10);

function Dashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const listFn = useServerFn(listActivities);
  const profileFn = useServerFn(getProfile);
  const delFn = useServerFn(deleteActivity);

  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: () => listFn({ data: undefined }) });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined }) });
  const goal = Number(profile?.daily_goal_kg ?? 10);

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities"] }); toast.success("Removed"); },
  });

  const today = todayStr();
  const todayKg = activities.filter((a) => a.occurred_at === today).reduce((s, a) => s + Number(a.kg_co2e), 0);
  const weekCutoff = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const weekKg = activities.filter((a) => a.occurred_at >= weekCutoff).reduce((s, a) => s + Number(a.kg_co2e), 0);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      map.set(d, 0);
    }
    for (const a of activities) {
      if (a.occurred_at >= weekCutoff && map.has(a.occurred_at)) {
        map.set(a.occurred_at, (map.get(a.occurred_at) ?? 0) + Number(a.kg_co2e));
      }
    }
    return Array.from(map.entries()).map(([d, kg]) => ({
      day: new Date(d).toLocaleDateString(undefined, { weekday: "short" }),
      kg: Math.round(kg * 10) / 10,
    }));
  }, [activities, weekCutoff]);

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of activities) if (a.occurred_at >= weekCutoff) map[a.category] = (map[a.category] ?? 0) + Number(a.kg_co2e);
    return Object.entries(map).map(([category, kg]) => ({
      category, label: CATEGORY_META[category as Category]?.label ?? category, kg: Math.round(kg * 10) / 10,
    }));
  }, [activities, weekCutoff]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSignOut={signOut} />

      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-10 space-y-10">
        <section>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Today</p>
              <h1 className="font-display text-6xl sm:text-7xl mt-1 leading-none">
                {todayKg.toFixed(1)}<span className="text-2xl text-muted-foreground"> kg CO₂e</span>
              </h1>
            </div>
            <LogActivityDialog />
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <StatCard label="Daily goal" value={`${goal} kg`} icon={<Target className="size-4" />}
              tone={todayKg <= goal ? "good" : "bad"}
              hint={todayKg <= goal ? `${(goal - todayKg).toFixed(1)} kg under goal` : `${(todayKg - goal).toFixed(1)} kg over goal`}
            />
            <StatCard label="vs. global avg" value={`${GLOBAL_AVG} kg`} icon={<TrendingDown className="size-4" />}
              tone={todayKg <= GLOBAL_AVG ? "good" : "bad"}
              hint={`${((todayKg / GLOBAL_AVG) * 100).toFixed(0)}% of average`}
            />
            <StatCard label="Paris target" value={`${PARIS_TARGET} kg`} icon={<Sprout className="size-4" />}
              tone={todayKg <= PARIS_TARGET ? "good" : "warn"}
              hint="Aligned with 1.5°C"
            />
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border-2 border-border rounded-md bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Last 7 days</h2>
              <span className="text-sm text-muted-foreground">Total {weekKg.toFixed(1)} kg</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={daily}>
                  <XAxis dataKey="day" stroke="oklch(0.45 0.03 150)" tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.45 0.03 150)" tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={{ background: "oklch(0.22 0.05 155)", color: "oklch(0.965 0.018 85)", border: "none", borderRadius: 6 }} formatter={(v) => [`${v} kg`, "CO₂e"]} />
                  <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                    {daily.map((d, i) => (
                      <Cell key={i} fill={d.kg > goal ? "var(--color-destructive)" : "var(--color-primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-2 border-border rounded-md bg-card p-6">
            <h2 className="font-display text-xl mb-4">Breakdown</h2>
            {byCat.length === 0 ? (
              <p className="text-sm text-muted-foreground">Log an activity to see your breakdown.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byCat} dataKey="kg" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {byCat.map((c, i) => (
                        <Cell key={i} fill={[`var(--chart-1)`, `var(--chart-2)`, `var(--chart-3)`, `var(--chart-4)`, `var(--chart-5)`][i % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "oklch(0.22 0.05 155)", color: "oklch(0.965 0.018 85)", border: "none", borderRadius: 6 }} formatter={(v: number, n) => [`${v.toFixed(1)} kg`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-2 space-y-1">
              {byCat.map((c, i) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-3 rounded-sm" style={{ background: [`var(--chart-1)`, `var(--chart-2)`, `var(--chart-3)`, `var(--chart-4)`, `var(--chart-5)`][i % 5] }} />
                    {c.label}
                  </span>
                  <span className="font-medium tabular-nums">{c.kg} kg</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-2 border-border rounded-md bg-card">
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="font-display text-xl">Recent activity</h2>
            <GoalDialog current={goal} />
          </div>
          {activities.length === 0 ? (
            <div className="px-6 pb-8 text-sm text-muted-foreground">Nothing logged yet. Tap “Log activity” to start.</div>
          ) : (
            <ul className="divide-y divide-border">
              {activities.slice(0, 20).map((a) => {
                const preset = PRESETS.find((p) => p.action === a.action);
                const Icon = preset ? ICONS[preset.icon] : Sprout;
                return (
                  <li key={a.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-md bg-secondary text-secondary-foreground grid place-items-center flex-shrink-0">
                        {Icon ? <Icon className="size-4" /> : <Sprout className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.quantity} {a.unit} · {new Date(a.occurred_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display text-lg tabular-nums">{Number(a.kg_co2e).toFixed(2)}<span className="text-xs text-muted-foreground"> kg</span></span>
                      <button aria-label="Delete activity" onClick={() => delMut.mutate(a.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="border-b-2 border-foreground/10 bg-background sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-3">
          <img src={logo} alt="" width={32} height={32} />
          <span className="font-display text-base">Verdant</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/app"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          <Link to="/coach"><Button variant="ghost" size="sm" className="gap-2"><MessageCircle className="size-4" />Coach</Button></Link>
          <Button variant="ghost" size="sm" onClick={onSignOut} aria-label="Sign out"><LogOut className="size-4" /></Button>
        </nav>
      </div>
    </header>
  );
}

function StatCard({ label, value, icon, tone, hint }: { label: string; value: string; icon: React.ReactNode; tone: "good" | "bad" | "warn"; hint: string }) {
  const toneCls = tone === "good" ? "border-success/30" : tone === "bad" ? "border-destructive/40" : "border-accent/50";
  const dotCls = tone === "good" ? "bg-success" : tone === "bad" ? "bg-destructive" : "bg-accent";
  return (
    <div className={`border-2 ${toneCls} rounded-md bg-card p-5`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`inline-block size-2 rounded-full ${dotCls}`} /> {hint}
      </div>
    </div>
  );
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
      setOpen(false);
      setPreset("");
      setQty("1");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = PRESETS.filter((p) => p.category === tab);
  const selected = filtered.find((p) => p.id === preset);
  const estimate = selected ? computeKg(selected.id, Number(qty) || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 px-5 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Plus className="size-4" />Log activity</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl">Log an activity</DialogTitle></DialogHeader>
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
                  const Icon = ICONS[p.icon] ?? Sprout;
                  const active = preset === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setPreset(p.id)}
                      className={`flex items-center gap-2 rounded-md border-2 p-3 text-left text-sm transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <Icon className="size-4 flex-shrink-0" />
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
        <div className="flex items-center justify-between mt-2 rounded-md bg-secondary px-4 py-3">
          <span className="text-sm text-muted-foreground">Estimated impact</span>
          <span className="font-display text-2xl">{estimate.toFixed(2)} <span className="text-xs">kg CO₂e</span></span>
        </div>

        <Button disabled={!selected || !qty || mut.isPending} onClick={() => selected && mut.mutate({ presetId: selected.id, quantity: Number(qty), occurredAt: date })}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90">
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
      <DialogTrigger asChild><Button variant="ghost" size="sm">Set goal</Button></DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="font-display text-xl">Daily goal</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Paris-aligned is ~5.5 kg/day. Global average is ~12.5 kg.</p>
        <Label htmlFor="goal">kg CO₂e / day</Label>
        <Input id="goal" type="number" min="1" max="50" step="0.5" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button onClick={() => mut.mutate(Number(val))} disabled={mut.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
      </DialogContent>
    </Dialog>
  );
}
