"use client";

import { useActionState } from "react";
import {
  createHousehold,
  joinHousehold,
  type HouseholdFormState,
} from "@/app/household/actions";

const initialState: HouseholdFormState = { error: null };

export function CreateHouseholdForm() {
  const [state, formAction, pending] = useActionState(
    createHousehold,
    initialState
  );

  return (
    <form action={formAction} className="card household-form">
      <h2>Start a household</h2>
      {state.error ? (
        <p role="alert" className="alert alert-error">
          {state.error}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="household-name">Household name</label>
        <p className="field-help" id="household-name-help">
          Optional. For example: The Dyers.
        </p>
        <input
          type="text"
          id="household-name"
          name="name"
          aria-describedby="household-name-help"
          autoComplete="off"
        />
      </div>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Creating…" : "Create household"}
      </button>
    </form>
  );
}

export function JoinHouseholdForm() {
  const [state, formAction, pending] = useActionState(
    joinHousehold,
    initialState
  );

  return (
    <form action={formAction} className="card household-form">
      <h2>Join a household</h2>
      {state.error ? (
        <p role="alert" className="alert alert-error">
          {state.error}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="invite-code">Invite code</label>
        <p className="field-help" id="invite-code-help">
          Ask the person who created the household for their invite code.
        </p>
        <input
          type="text"
          id="invite-code"
          name="code"
          aria-describedby="invite-code-help"
          autoComplete="off"
        />
      </div>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Joining…" : "Join household"}
      </button>
    </form>
  );
}
