import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <section className="page-narrow">
      <h1>Sign in</h1>

      {error ? (
        <p role="alert" className="alert alert-error">
          Sign-in failed: {error}
        </p>
      ) : null}

      <p>
        Sign in with your Google account to save recipes, search them by
        ingredient, and use cooking mode.
      </p>

      <form action="/auth/signin" method="post">
        <button type="submit" className="button">
          Continue with Google
        </button>
      </form>
    </section>
  );
}
