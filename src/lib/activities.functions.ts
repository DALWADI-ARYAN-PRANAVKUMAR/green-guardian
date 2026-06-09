import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeKg, presetById } from "./emissions";

const LogInput = z.object({
  presetId: z.string().min(1).max(64),
  quantity: z.number().positive().max(100000),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
});

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LogInput.parse(d))
  .handler(async ({ data, context }) => {
    const preset = presetById(data.presetId);
    if (!preset) throw new Error("Unknown activity");
    const kg = computeKg(data.presetId, data.quantity);
    const { error, data: row } = await context.supabase
      .from("activities")
      .insert({
        user_id: context.userId,
        category: preset.category,
        action: preset.action,
        quantity: data.quantity,
        unit: preset.unit,
        kg_co2e: kg,
        notes: data.notes ?? null,
        occurred_at: data.occurredAt,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const sinceStr = since.toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("activities")
      .select("*")
      .gte("occurred_at", sinceStr)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("activities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ daily_goal_kg: z.number().min(1).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ daily_goal_kg: data.daily_goal_kg })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
