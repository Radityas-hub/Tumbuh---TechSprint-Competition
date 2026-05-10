"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, Stethoscope, Settings as SettingsIcon, X } from "lucide-react";

import { navItems } from "./constants";
import { MobileTabBar } from "./MobileTabBar";
import { MobileTopBar } from "./MobileTopBar";
import type { ChildApiModel, Screen } from "./types";
import { cx } from "./utils";

export function AppShell({
  screen,
  go,
  children,
  activeChild,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
  children: ReactNode;
  activeChild?: ChildApiModel | null;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const supportNeed = activeChild?.supportNeed?.toLowerCase() ?? "";
  const isConsultationHint = supportNeed.includes("konsultasi");
  const isReminderHint =
    supportNeed.includes("reminder") || supportNeed.includes("rutinitas");
  const isArticleHint =
    supportNeed.includes("artikel") || supportNeed.includes("edukasi");

  function hintFor(id: Screen) {
    if (id === "consultation" && isConsultationHint) return "Rekomendasi";
    if (id === "progress" && isReminderHint) return "Rutin";
    if (id === "education" && isArticleHint) return "Cocok";
    return null;
  }

  const closeAll = () => {
    setNavOpen(false);
    setMoreOpen(false);
  };

  const handleNavigate = (target: Screen) => {
    closeAll();
    go(target);
  };

  useEffect(() => {
    if (!navOpen && !moreOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [navOpen, moreOpen]);

  return (
    <div className="product-shell">
      <MobileTopBar
        onMenuOpen={() => setNavOpen(true)}
        isMenuOpen={navOpen}
      />

      <aside
        id="mobile-nav-drawer"
        className={cx("sidebar", navOpen && "is-open")}
        aria-hidden={!navOpen || undefined}
      >
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <button
              className="brand sidebar-brand"
              onClick={() => handleNavigate("home")}
            >
              <span>Tumbuh</span>
            </button>
            <button
              type="button"
              className="sidebar-close"
              aria-label="Tutup menu"
              onClick={closeAll}
            >
              <X size={20} />
            </button>
          </div>
          <div className="sidebar-section">
            {navItems.map((item) => {
              const hint = hintFor(item.id);
              return (
                <button
                  key={item.id}
                  className={cx(
                    "sidebar-link",
                    screen === item.id && "active",
                  )}
                  onClick={() => handleNavigate(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {hint ? <em className="sidebar-hint">{hint}</em> : null}
                </button>
              );
            })}
          </div>
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <p>
              Data anak bersifat sensitif. Backend perlu consent, enkripsi, dan
              kontrol hapus data.
            </p>
          </div>
        </div>
      </aside>

      <div
        className={cx("sidebar-backdrop", navOpen && "is-open")}
        onClick={closeAll}
        aria-hidden="true"
      />

      <section className="workspace">{children}</section>

      <MobileTabBar
        screen={screen}
        go={handleNavigate}
        onMoreOpen={() => setMoreOpen(true)}
        isMoreOpen={moreOpen}
      />

      {moreOpen && (
        <>
          <div
            className="mobile-sheet-backdrop is-open"
            onClick={closeAll}
            aria-hidden="true"
          />
          <div
            className="mobile-more-sheet is-open"
            role="dialog"
            aria-modal="true"
            aria-label="Menu lainnya"
          >
            <div className="mobile-more-head">
              <strong>Lainnya</strong>
              <button
                type="button"
                className="sidebar-close"
                aria-label="Tutup"
                onClick={closeAll}
              >
                <X size={20} />
              </button>
            </div>
            <button
              type="button"
              className={cx(
                "mobile-more-item",
                screen === "consultation" && "active",
              )}
              onClick={() => handleNavigate("consultation")}
            >
              <Stethoscope size={20} />
              <span>Konsultasi</span>
            </button>
            <button
              type="button"
              className={cx(
                "mobile-more-item",
                screen === "settings" && "active",
              )}
              onClick={() => handleNavigate("settings")}
            >
              <SettingsIcon size={20} />
              <span>Pengaturan</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
