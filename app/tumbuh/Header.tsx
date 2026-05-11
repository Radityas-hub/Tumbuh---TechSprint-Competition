import Link from "next/link";
import { Menu, X } from "lucide-react";

import { homeNavItems } from "./constants";

export function Header({
  mobileOpen,
  setMobileOpen,
  startHref,
}: {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  startHref: string;
}) {
  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="site-header">
      <Link
        className="brand"
        href="#home"
        onClick={closeMenu}
        aria-label="Ke halaman awal"
      >
        <span>Tumbuh</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigasi utama">
        {homeNavItems.map((item) => (
          <Link key={item.href} className="nav-link" href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="nav-link desktop-only" href="/login">
        Masuk
      </Link>
      <Link className="ghost-button desktop-only" href={startHref}>
        Get Started
      </Link>
      <button
        className="menu-button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Buka menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {mobileOpen && (
        <div className="mobile-panel">
          {homeNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" onClick={closeMenu}>
            Masuk
          </Link>
          <Link
            className="mobile-start-link"
            href={startHref}
            onClick={closeMenu}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
