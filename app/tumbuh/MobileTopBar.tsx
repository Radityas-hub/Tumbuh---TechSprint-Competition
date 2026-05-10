"use client";

import { Menu } from "lucide-react";

/**
 * Sticky top bar yang hanya terlihat di mobile (≤ 900px) via CSS display toggle.
 * Desktop tetap memakai sidebar persistent — komponen ini mount di semua viewport
 * tapi visually hidden di desktop untuk hindari useMediaQuery cost.
 */
export function MobileTopBar({
  onMenuOpen,
  isMenuOpen,
}: {
  onMenuOpen: () => void;
  isMenuOpen: boolean;
}) {
  return (
    <header className="mobile-topbar" role="banner">
      <button
        type="button"
        className="mobile-topbar-menu"
        aria-label="Buka menu navigasi"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav-drawer"
        onClick={onMenuOpen}
      >
        <Menu size={22} />
      </button>
      <span className="mobile-topbar-brand">Tumbuh</span>
    </header>
  );
}
