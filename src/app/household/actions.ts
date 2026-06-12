"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type HouseholdFormState = {
  error: string | null;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return supabase;
}

export async function createHousehold(
  _previous: HouseholdFormState,
  formData: FormData
): Promise<HouseholdFormState> {
  const supabase = await requireUser();
  const { error } = await supabase.rpc("create_household", {
    household_name: String(formData.get("name") ?? ""),
  });
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/household");
  return { error: null };
}

export async function joinHousehold(
  _previous: HouseholdFormState,
  formData: FormData
): Promise<HouseholdFormState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Enter the invite code you were given." };
  }
  const supabase = await requireUser();
  const { error } = await supabase.rpc("join_household", { code });
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/household");
  revalidatePath("/recipes");
  return { error: null };
}

export async function leaveHousehold(formData: FormData) {
  const householdId = String(formData.get("household_id") ?? "");
  if (!householdId) {
    return;
  }
  const supabase = await requireUser();
  await supabase.rpc("leave_household", { hid: householdId });
  revalidatePath("/household");
  revalidatePath("/recipes");
}
