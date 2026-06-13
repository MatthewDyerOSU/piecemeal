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

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="header-bar">
          <Link href="/" className="wordmark">
            <LogoMark />
            piece-meal<span className="visually-hidden"> home</span>
          </Link>

          <div className="auth-area">
            {user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="button button-secondary">
                  Sign out
                  <span className="visually-hidden"> ({displayName})</span>
                </button>
              </form>
            ) : (
              <Link href="/login" className="button button-secondary">
                Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="header-nav">
          <SiteNav />
        </div>
      </div>
    </header>
  );
}
