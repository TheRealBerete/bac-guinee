"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { label: "Accueil", href: "/" },
  { label: "Statistiques", href: "/#stats" },
  { label: "À propos", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[1216px] flex items-center justify-between gap-4 bg-white rounded-[16px] px-6 py-4 shadow-[0_8px_24px_rgba(16,24,40,0.06),0_2px_6px_rgba(16,24,40,0.04)]">
      <Link href="/" className="inline-flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-dark flex items-center justify-center text-white font-bold text-sm">BG</div>
        <span className="font-semibold text-lg text-text-primary hidden sm:inline">Bac Guinée</span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition-colors duration-200 ${
              pathname === item.href ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        className="md:hidden w-10 h-10 flex items-center justify-center rounded-[10px]"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {menuOpen && (
        <nav className="md:hidden flex flex-col gap-4 items-start absolute top-[70px] left-0 right-0 bg-white px-6 py-5 rounded-[16px] shadow-[0_8px_24px_rgba(16,24,40,0.06),0_2px_6px_rgba(16,24,40,0.04)]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
