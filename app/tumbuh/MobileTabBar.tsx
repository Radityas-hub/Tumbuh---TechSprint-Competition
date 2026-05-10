"use client";

import {
  BookOpen,
  ClipboardList,
  Home,
  MoreHorizontal,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

import type { Screen } from "./types";
import { cx } from "./utils";

type TabItem = {
  id: Screen | "more";
  label: string;
  icon: ReactNode;
};

const tabItems: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
  { id: "roadmap", label: "Roadmap", icon: <Target size={20} /> },
  { id: "progress", label: "Catatan", icon: <ClipboardList size={20} /> },
  { id: "education", label: "Edukasi", icon: <BookOpen size={20} /> },
  { id: "more", label: "Lainnya", icon: <MoreHorizontal size={20} /> },
];

const moreScreens: Screen[] = ["consultation", "settings"];

/**
 * Bottom tab bar mobile — 4 destinasi utama + "Lainnya" untuk screen sekunder.
 * Desktop: hidden via CSS.
 */
export function MobileTabBar({
  screen,
  go,
  onMoreOpen,
  isMoreOpen,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
  onMoreOpen: () => void;
  isMoreOpen: boolean;
}) {
  const isOnMoreScreen = moreScreens.includes(screen);

  return (
    <nav className="mobile-tabs" role="tablist" aria-label="Navigasi utama">
      {tabItems.map((item) => {
        const isMore = item.id === "more";
        const active = isMore
          ? isMoreOpen || isOnMoreScreen
          : screen === item.id;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cx("mobile-tab", active && "is-active")}
            onClick={() => {
              if (isMore) {
                onMoreOpen();
                return;
              }
              go(item.id as Screen);
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
