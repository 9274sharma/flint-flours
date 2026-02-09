"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "font-semibold text-gray-900"
          : "text-gray-600 hover:text-gray-900"
      }
    >
      {children}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <NavLink href="/admin" active={pathname === "/admin"}>
          Admin
        </NavLink>
        <NavLink
          href="/admin/products"
          active={pathname?.startsWith("/admin/products")}
        >
          Products
        </NavLink>
        <NavLink
          href="/admin/orders"
          active={pathname?.startsWith("/admin/orders")}
        >
          Orders
        </NavLink>
        <NavLink
          href="/admin/craft"
          active={pathname?.startsWith("/admin/craft")}
        >
          Craft
        </NavLink>
        <Link
          href="/"
          className="ml-auto text-sm text-gray-600 hover:text-gray-900"
          aria-label="Return to main site"
        >
          ← Back to site
        </Link>
      </div>
    </nav>
  );
}
