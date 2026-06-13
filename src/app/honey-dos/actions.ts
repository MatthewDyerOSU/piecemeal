"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HONEY_DO_CADENCES } from "@/lib/honeyDos";

function normalizeCadence(value: string): string {
  return (HONEY_DO_CADENCES as string[]).includes(value) ? value : "none";
}

async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { supabase, user };
}

// Row-level security restricts every operation below to members of the
// item's household, so these actions don't re-check membership.

export async function addHoneyDo(
  householdId: string,
  text: string,
  groupName: string,
  cadence: string
) {
  const trimmed = text.trim();
  if (!trimmed || !householdId) {
    return;
  }
  const { supabase } = await requireClient();
  await supabase.from("honey_dos").insert({
    household_id: householdId,
    text: trimmed,
    group_name: groupName.trim(),
    cadence: normalizeCadence(cadence),
  });
  revalidatePath("/honey-dos");
}

export async function setHoneyDoChecked(id: string, checked: boolean) {
  const { supabase } = await requireClient();
  // Record when it was checked so the recurrence reset knows whether it
  // happened in the current period.
  await supabase
    .from("honey_dos")
    .update({ checked, checked_at: checked ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/honey-dos");
}

export async function updateHoneyDo(
  id: string,
  text: string,
  groupName: string,
  cadence: string
) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  const { supabase } = await requireClient();
  await supabase
    .from("honey_dos")
    .update({
      text: trimmed,
      group_name: groupName.trim(),
      cadence: normalizeCadence(cadence),
    })
    .eq("id", id);
  revalidatePath("/honey-dos");
}

export async function deleteHoneyDo(id: string) {
  const { supabase } = await requireClient();
  await supabase.from("honey_dos").delete().eq("id", id);
  revalidatePath("/honey-dos");
}

export async function clearCheckedHoneyDos(householdId: string) {
  const { supabase } = await requireClient();
  // Only clear completed one-off items; recurring chores are meant to come
  // back, so a checked recurring item is left in place.
  await supabase
    .from("honey_dos")
    .delete()
    .eq("household_id", householdId)
    .eq("checked", true)
    .eq("cadence", "none");
  revalidatePath("/honey-dos");
}
