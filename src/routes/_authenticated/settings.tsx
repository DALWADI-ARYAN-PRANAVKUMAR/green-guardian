import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AppSidebar, MobileTopBar, MobileBottomNav } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "Settings — EcoTrace" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pw, setPw] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      setDisplayName(prof?.display_name ?? "");
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", u.user.id);
      if (error) throw error;
      toast.success("Profile updated");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllActivities() {
    if (!confirm("Delete all your logged activities? This cannot be undone.")) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("activities").delete().eq("user_id", u.user.id);
    if (error) return toast.error(error.message);
    toast.success("Activities cleared");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileTopBar title="Settings" />
        <main className="flex-1 px-4 md:px-10 py-8 max-w-3xl w-full mx-auto pb-24 lg:pb-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-on-surface-variant mt-1">Manage your account and data.</p>
          </header>

          <section className="bg-card border border-outline-variant rounded-2xl p-6 mb-6 custom-shadow">
            <h2 className="text-lg font-bold mb-4">Profile</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled className="bg-surface-container-low" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary-container">
                {loading ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </section>

          <section className="bg-card border border-outline-variant rounded-2xl p-6 mb-6 custom-shadow">
            <h2 className="text-lg font-bold mb-4">Change password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <Button type="submit" disabled={loading || !pw} className="bg-primary text-primary-foreground hover:bg-primary-container">
                Update password
              </Button>
            </form>
          </section>

          <section className="bg-card border border-destructive/30 rounded-2xl p-6 custom-shadow">
            <h2 className="text-lg font-bold mb-2 text-destructive">Danger zone</h2>
            <p className="text-sm text-on-surface-variant mb-4">Permanently delete every activity you've logged.</p>
            <Button onClick={deleteAllActivities} variant="destructive">Delete all activities</Button>
          </section>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
