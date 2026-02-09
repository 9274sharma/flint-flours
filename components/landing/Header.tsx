"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/contexts/CartContext";
import type { User } from "@supabase/supabase-js";

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
      className={`relative inline-block transition after:absolute after:bottom-0 after:left-0 after:h-px after:transition-all after:duration-300 ${
        active
          ? "text-stone-900 font-medium after:w-full after:bg-stone-900"
          : "text-stone-600 hover:text-stone-900 after:w-0 after:bg-stone-900 hover:after:w-full"
      }`}
    >
      {children}
    </Link>
  );
}

function UserIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`h-6 w-6 ${active ? "text-stone-900" : "text-stone-600"}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  const { scrollY } = useScroll();
  const headerShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 1px 0 0 rgb(0 0 0 / 0.03)", "0 4px 6px -1px rgb(0 0 0 / 0.05)"],
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isAbout = pathname === "/about" || pathname?.startsWith("/about/");
  const isLogin = pathname === "/login";
  const isAccount = pathname === "/account";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ boxShadow: headerShadow }}
      className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-serif text-xl font-bold text-stone-850 transition hover:text-stone-950 active:scale-[0.98]"
        >
          Flint & Flours
        </Link>
        <div className="flex items-center gap-6">
          <NavLink href="/about" active={isAbout}>
            About
          </NavLink>
          <NavLink href="/shop">Shop</NavLink>
          <Link
            href="/cart"
            className={`relative inline-block transition after:absolute after:bottom-0 after:left-0 after:h-px after:transition-all after:duration-300 ${
              pathname === "/cart"
                ? "text-stone-900 font-medium after:w-full after:bg-stone-900"
                : "text-stone-600 hover:text-stone-900 after:w-0 after:bg-stone-900 hover:after:w-full"
            }`}
          >
            Cart
            {cartCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-stone-850 px-1.5 py-0.5 text-xs font-medium text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <Link
              href="/account"
              className={`flex items-center justify-center rounded-full p-1.5 transition hover:bg-stone-100 ${
                isAccount ? "bg-stone-100 text-stone-900" : "text-stone-600"
              }`}
              aria-label="Account"
            >
              <UserIcon active={isAccount} />
            </Link>
          ) : (
            <Link
              href="/login"
              className={`flex items-center justify-center rounded-full p-1.5 transition hover:bg-stone-100 ${
                isLogin ? "bg-stone-100 text-stone-900" : "text-stone-600"
              }`}
              aria-label="Sign in"
            >
              <UserIcon active={isLogin} />
            </Link>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
