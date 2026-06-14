"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/" ? "bg-accent text-white" : "hover:bg-black/5",
        )}
      >
        🏠 Dashboard
      </Link>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-white" : "hover:bg-black/5",
            )}
          >
            <span className="mr-2">{item.emoji}</span>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link href="/" className="font-bold">
          Hodlin Family Hub
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 hover:bg-black/5"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>
      {open && (
        <div className="no-print border-b border-border bg-card px-4 py-3 md:hidden">{links}</div>
      )}

      {/* Desktop sidebar */}
      <aside className="no-print hidden w-64 shrink-0 border-r border-border bg-card p-4 md:flex md:flex-col">
        <Link href="/" className="mb-6 block px-3">
          <div className="text-lg font-bold leading-tight">Hodlin</div>
          <div className="text-sm text-muted">Family Hub</div>
        </Link>
        {links}
      </aside>
    </>
  );
}
