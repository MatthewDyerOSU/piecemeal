import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "./NavLinks";
import LogoMark from "./LogoMark";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="wordmark">
          <LogoMark />
          piece-meal<span className="visually-hidden"> home</span>
        </Link>

        <nav aria-label="Main">
          <NavLinks />
        </nav>

        <div className="auth-area">
          {user ? (
            <>
              <span className="user-name">
                <span className="visually-hidden">Signed in as </span>
                {displayName}
              </span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="button button-secondary">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="button button-secondary">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
