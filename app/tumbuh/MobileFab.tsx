"use client";

import { Plus } from "lucide-react";

/**
 * Floating Action Button sticky di thumb zone mobile (≤ 640px).
 * Desktop-hidden via CSS. Muncul di atas bottom tab bar + safe-area.
 */
export function MobileFab({
  label = "Catat hari ini",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="mobile-fab"
      aria-label={label}
      onClick={onClick}
    >
      <Plus size={22} />
    </button>
  );
}
