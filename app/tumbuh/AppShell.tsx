import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { navItems } from "./constants";
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

  return (
    <div className="product-shell">
      <aside className="sidebar">
        <button className="brand sidebar-brand" onClick={() => go("home")}>
          <span>Tumbuh</span>
        </button>
        <div className="sidebar-section">
          {navItems.map((item) => {
            const hint = hintFor(item.id);
            return (
              <button
                key={item.id}
                className={cx("sidebar-link", screen === item.id && "active")}
                onClick={() => go(item.id)}
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
      </aside>
      <section className="workspace">{children}</section>
    </div>
  );
}
