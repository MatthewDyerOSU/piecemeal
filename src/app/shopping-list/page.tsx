import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ShoppingListItem } from "@/types/shopping";
import ShoppingList from "@/components/ShoppingList";

export const metadata: Metadata = {
  title: "Shopping list",
};

export default async function ShoppingListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .order("created_at", { ascending: true });

  const items = (data as ShoppingListItem[]) ?? [];

  return (
    <section className="page-narrow">
      <h1>Shopping list</h1>
      <p>
        Check items off as you shop. This list is your own — each person
        keeps a separate one.
      </p>

      {error ? (
        <p role="alert" className="alert alert-error">
          Could not load your shopping list: {error.message}
        </p>
      ) : (
        <ShoppingList initialItems={items} />
      )}
    </section>
  );
}
