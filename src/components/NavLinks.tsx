"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Find recipes" },
  { href: "/recipes", label: "Saved recipes" },
  { href: "/recipes/new", label: "Add a recipe" },
  { href: "/shopping-list", label: "Shopping list" },
  { href: "/honey-dos", label: "Honey-dos" },
  { href: "/household", label: "Households" },
];

export default function NavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="nav-list">
      {links.map((link) => {
        const current = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={current ? "page" : undefined}
              onClick={onNavigate}
            >
              {current ? (
                <span className="nav-current-marker" aria-hidden="true" />
              ) : null}
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
