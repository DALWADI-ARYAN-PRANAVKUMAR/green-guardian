import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Sparkles, ScrollText, Leaf, LifeBuoy, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coach", label: "AI Assistant", icon: Sparkles },
  { to: "/log", label: "Activity Log", icon: ScrollText },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    window.location.assign("/auth");
  }

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 sticky top-0 shrink-0 bg-surface-container-low border-r border-outline-variant py-6">
      <div className="px-5 mb-6">
        <Link to="/app" className="flex items-center gap-2.5">
          <span className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Leaf className="size-5" />
          </span>
          <span className="text-xl font-bold text-primary tracking-tight">EcoTrace</span>
        </Link>
        <div className="flex items-center gap-3 mt-5 p-3 bg-surface-container-high rounded-xl">
          <div className="size-10 rounded-lg bg-tertiary-fixed grid place-items-center">
            <Leaf className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Impact Level 12</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Carbon Pioneer</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-auto space-y-1 pt-4 border-t border-outline-variant">
        <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition" activeProps={{ className: "bg-primary-container text-on-primary-container" }}>
          <Settings className="size-5" /> Settings
        </Link>
        <Link to="/support" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition" activeProps={{ className: "bg-primary-container text-on-primary-container" }}>
          <LifeBuoy className="size-5" /> Support
        </Link>
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high transition">
          <LogOut className="size-5" /> Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileTopBar({ title }: { title: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-outline-variant px-4 py-3 flex items-center justify-between">
      <Link to="/app" className="flex items-center gap-2">
        <span className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center">
          <Leaf className="size-4" />
        </span>
        <span className="font-bold text-primary">EcoTrace</span>
      </Link>
      <span className="text-sm font-semibold text-on-surface-variant">{title}</span>
    </header>
  );
}

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container border-t border-outline-variant flex justify-around py-2">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = path === item.to;
        return (
          <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-full ${active ? "bg-tertiary-container text-on-tertiary-container" : "text-on-surface-variant"}`}>
            <Icon className="size-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
