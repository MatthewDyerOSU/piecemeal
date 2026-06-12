import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Household, HouseholdMember } from "@/types/household";
import {
  CreateHouseholdForm,
  JoinHouseholdForm,
} from "@/components/HouseholdForms";
import LeaveHouseholdButton from "@/components/LeaveHouseholdButton";
import { leaveHousehold } from "./actions";

export const metadata: Metadata = {
  title: "Households",
};

type MemberRow = HouseholdMember & { household_id: string };

export default async function HouseholdPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: householdData, error } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .order("name", { ascending: true });
  const households = (householdData as Household[]) ?? [];

  let members: MemberRow[] = [];
  if (households.length > 0) {
    const { data: memberData } = await supabase
      .from("household_members")
      .select("household_id, user_id, display_name, joined_at")
      .order("joined_at", { ascending: true });
    members = (memberData as MemberRow[]) ?? [];
  }

  return (
    <section className="page-narrow">
      <h1>Households</h1>

      <p>
        A household shares one recipe collection between accounts: everyone
        in it sees, searches, and can edit each other&apos;s recipes while
        keeping separate sign-ins. You can belong to several households —
        each one sees all of your recipes.
      </p>

      {error ? (
        <p role="alert" className="alert alert-error">
          Could not load your households: {error.message}
        </p>
      ) : null}

      {households.map((household) => (
        <section
          key={household.id}
          className="card household-card"
          aria-labelledby={`household-${household.id}`}
        >
          <h2 id={`household-${household.id}`}>{household.name}</h2>

          <h3 className="eyebrow">Invite someone</h3>
          <p>
            Have them sign in with their own account, open this page, and
            enter this invite code:
          </p>
          <p className="invite-code">{household.invite_code}</p>

          <h3 className="eyebrow">Members</h3>
          <ul>
            {members
              .filter((member) => member.household_id === household.id)
              .map((member) => (
                <li key={member.user_id}>
                  {member.display_name}
                  {member.user_id === user.id ? " (you)" : ""}
                </li>
              ))}
          </ul>

          <form action={leaveHousehold}>
            <input type="hidden" name="household_id" value={household.id} />
            <LeaveHouseholdButton name={household.name} />
          </form>
        </section>
      ))}

      <section aria-labelledby="add-household-heading">
        <h2 className="eyebrow" id="add-household-heading">
          {households.length > 0
            ? "Start or join another"
            : "Start or join a household"}
        </h2>
        <div className="household-options">
          <CreateHouseholdForm />
          <JoinHouseholdForm />
        </div>
      </section>
    </section>
  );
}
