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
  title: "Household",
};

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
    .maybeSingle();
  const household = householdData as Household | null;

  let members: HouseholdMember[] = [];
  if (household) {
    const { data: memberData } = await supabase
      .from("household_members")
      .select("user_id, display_name, joined_at")
      .order("joined_at", { ascending: true });
    members = (memberData as HouseholdMember[]) ?? [];
  }

  return (
    <section className="page-narrow">
      <h1>Household</h1>

      {error ? (
        <p role="alert" className="alert alert-error">
          Could not load your household: {error.message}
        </p>
      ) : household ? (
        <>
          <p>
            You are in <strong>{household.name}</strong>. Everyone in the
            household sees, searches, and can edit each other&apos;s saved
            recipes.
          </p>

          <section aria-labelledby="invite-heading">
            <h2 className="eyebrow" id="invite-heading">
              Invite someone
            </h2>
            <p>
              Have them sign in with their own account, open this Household
              page, and enter this invite code:
            </p>
            <p className="invite-code">{household.invite_code}</p>
          </section>

          <section aria-labelledby="members-heading">
            <h2 className="eyebrow" id="members-heading">
              Members
            </h2>
            <ul>
              {members.map((member) => (
                <li key={member.user_id}>
                  {member.display_name}
                  {member.user_id === user.id ? " (you)" : ""}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="leave-heading">
            <h2 className="eyebrow" id="leave-heading">
              Leave
            </h2>
            <p>
              Leaving keeps the recipes you added with your account, but you
              and the other members will stop seeing each other&apos;s
              recipes.
            </p>
            <form action={leaveHousehold}>
              <LeaveHouseholdButton />
            </form>
          </section>
        </>
      ) : (
        <>
          <p>
            A household lets two (or more) accounts share one recipe
            collection — everyone sees, searches, and can edit each
            other&apos;s recipes while keeping separate sign-ins. Start one
            and share the invite code, or join with a code you were given.
          </p>
          <div className="household-options">
            <CreateHouseholdForm />
            <JoinHouseholdForm />
          </div>
        </>
      )}
    </section>
  );
}
