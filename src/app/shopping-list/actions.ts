"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

/** Adds many items (e.g. a recipe's ingredients). Returns how many landed. */
export async function addToShoppingList(
  items: string[]
): Promise<{ added: number }> {
  const { supabase, user } = await requireClient();
  const rows = items
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .map((text) => ({ user_id: user.id, text }));
  if (rows.length === 0) {
    return { added: 0 };
  }
  await supabase.from("shopping_list_items").insert(rows);
  revalidatePath("/shopping-list");
  return { added: rows.length };
}

export async function addShoppingItem(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  const { supabase, user } = await requireClient();
  await supabase
    .from("shopping_list_items")
    .insert({ user_id: user.id, text: trimmed });
  revalidatePath("/shopping-list");
}

export async function setShoppingItemChecked(id: string, checked: boolean) {
  const { supabase } = await requireClient();
  await supabase.from("shopping_list_items").update({ checked }).eq("id", id);
  revalidatePath("/shopping-list");
}

export async function updateShoppingItem(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  const { supabase } = await requireClient();
  await supabase
    .from("shopping_list_items")
    .update({ text: trimmed })
    .eq("id", id);
  revalidatePath("/shopping-list");
}

export async function deleteShoppingItem(id: string) {
  const { supabase } = await requireClient();
  await supabase.from("shopping_list_items").delete().eq("id", id);
  revalidatePath("/shopping-list");
}

export async function clearCheckedShoppingItems() {
  const { supabase } = await requireClient();
  await supabase.from("shopping_list_items").delete().eq("checked", true);
  revalidatePath("/shopping-list");
}
