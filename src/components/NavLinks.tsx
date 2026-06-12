"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Find recipes" },
  { href: "/recipes", label: "Saved recipes" },
  { href: "/recipes/new", label: "Add a recipe" },
  { href: "/household", label: "Household" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="nav-list">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
