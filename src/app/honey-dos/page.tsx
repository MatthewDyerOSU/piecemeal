import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Household } from "@/types/household";
import type { HoneyDo } from "@/types/honeyDo";
import { isDueForReset } from "@/lib/honeyDos";
import HoneyDos from "@/components/HoneyDos";

export const metadata: Metadata = {
  title: "Honey-dos",
};

export default async function HoneyDosPage({
  searchParams,
}: {
  searchParams: Promise<{ household?: string }>;
}) {
  const { household: requested } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: householdData } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .order("name", { ascending: true });
  const households = (householdData as Household[]) ?? [];

  if (households.length === 0) {
    return (
      <section className="page-narrow">
        <h1>Honey-dos</h1>
        <p>
          Honey-dos is a shared checklist for your household — chores,
          projects, anything that needs doing. Create or join a household
          first, then everyone in it shares one list.
        </p>
        <p>
          <Link href="/household" className="button">
            Go to Households
          </Link>
        </p>
      </section>
    );
  }

  const active =
    households.find((h) => h.id === requested) ?? households[0];

  const { data, error } = await supabase
    .from("honey_dos")
    .select("*")
    .eq("household_id", active.id)
    .order("created_at", { ascending: true });

  let items = (data as HoneyDo[]) ?? [];

  // Lazy recurrence reset: recurring items checked in an earlier period
  // flip back to unchecked now (and the change is persisted for everyone).
  const due = items.filter((item) => isDueForReset(item));
  if (due.length > 0) {
    await supabase
      .from("honey_dos")
      .update({ checked: false, checked_at: null })
      .in(
        "id",
        due.map((item) => item.id)
      );
    const dueIds = new Set(due.map((item) => item.id));
    items = items.map((item) =>
      dueIds.has(item.id)
        ? { ...item, checked: false, checked_at: null }
        : item
    );
  }

  return (
    <section className="page-narrow">
      <h1>Honey-dos</h1>
      <p>
        A shared checklist for {active.name}. Check things off as they get
        done — everyone in the household sees the same list.
      </p>

      {households.length > 1 ? (
        <form method="get" action="/honey-dos" className="household-switch">
          <label htmlFor="household-select">Household</label>
          <select
            id="household-select"
            name="household"
            defaultValue={active.id}
          >
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <button type="submit" className="button button-secondary">
            Switch
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="alert alert-error">
          Could not load this list: {error.message}
        </p>
      ) : (
        <HoneyDos householdId={active.id} initialItems={items} />
      )}
    </section>
  );
}
