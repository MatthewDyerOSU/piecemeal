import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteNav from "./SiteNav";
import LogoMark from "./LogoMark";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email;

  // Signed-in users get Sign out (top bar on wide screens, in the menu on
  // compact ones). Signed-out users get no header account control — Sign
  // in lives on the landing page, since a header button that only ever
  // routed to /login confused first-time visitors.
  const account = user ? (
    <form action="/auth/signout" method="post">
      <button type="submit" className="button button-secondary">
        Sign out
        <span className="visually-hidden"> ({displayName})</span>
      </button>
    </form>
  ) : null;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="header-bar">
          <Link href="/" className="wordmark">
            <LogoMark />
            piece-meal<span className="visually-hidden"> home</span>
          </Link>

          {account ? (
            <div className="auth-area auth-area-bar">{account}</div>
          ) : null}
        </div>

        <div className="header-nav">
          <SiteNav account={account} />
        </div>
      </div>
    </header>
  );
}
