"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  FileStack,
  LayoutDashboard,
  RefreshCcw,
} from "lucide-react";

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type AdminKnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  lastReviewedAt: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  focusAreaTags: string[];
  conditionTags: string[];
  chunkCount: number;
};

export type AdminKnowledgeChunk = {
  id: string;
  articleId: string;
  chunkIndex: number;
  heading: string | null;
  chunkText: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  lastReviewedAt: string | null;
  focusAreaTags: string[];
  conditionTags: string[];
  article: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
};

export type AdminEvaluationItem = {
  id: string;
  childId: string | null;
  childName: string | null;
  responseLogId: string;
  question: string;
  overallScore: number;
  relevanceScore: number;
  safetyScore: number;
  faithfulnessScore: number;
  actionabilityScore: number;
  issues: string[];
  summary: string | null;
  createdAt: string;
};

export type AdminChildSnapshotHealth = {
  childId: string;
  childName: string;
  onboardingCompletedAt: string | null;
  progressCount: number;
  snapshot: {
    id: string;
    version: number;
    summary: string;
    progressCount: number;
    roadmapCount: number;
    lastProgressAt: string | null;
    sparseData: boolean;
    hasWeeklyInsight: boolean;
    updatedAt: string;
  } | null;
};

export type AdminDashboardData = {
  overview: {
    articleCount: number;
    chunkCount: number;
    pendingReviewCount: number;
    childCount: number;
    responseLogCount: number;
    fallbackCount: number;
    evaluationCount: number;
    averageOverallScore: number | null;
    lowScoreCount: number;
  };
  issueHotspots: Array<{
    issue: string;
    count: number;
  }>;
  reviewQueue: {
    articles: AdminKnowledgeArticle[];
    chunks: AdminKnowledgeChunk[];
  };
  latestEvaluations: AdminEvaluationItem[];
  childHealth: AdminChildSnapshotHealth[];
};

export type AdminDashboardResponse = {
  dashboard: AdminDashboardData;
};

function getDevelopmentAuthHeaders() {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  const authUserId = process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID?.trim() || "dev-user-1";
  const email = process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL?.trim() || "dev@example.com";
  const displayName = process.env.NEXT_PUBLIC_DEV_AUTH_NAME?.trim() || "Guardian Dev";

  return {
    "x-dev-auth-user-id": authUserId,
    "x-dev-auth-email": email,
    "x-dev-auth-name": displayName,
  };
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  Object.entries(getDevelopmentAuthHeaders()).forEach(([key, value]) => {
    if (!headers.has(key) && value) {
      headers.set(key, value);
    }
  });

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json()) as { data?: T } & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || "Request failed");
  }

  return payload.data as T;
}

export function formatDateTimeCompact(value: string | null) {
  if (!value) {
    return "Belum ada";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

export function useAdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function loadDashboard() {
    try {
      setState("loading");
      const data = await apiRequest<AdminDashboardResponse>("/api/admin/dashboard");
      setDashboard(data.dashboard);
      setState("ready");
    } catch (error) {
      console.error("Failed to load admin dashboard", error);
      setState("error");
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return {
    dashboard,
    state,
    reload: loadDashboard,
  };
}

export function AdminPageShell({
  active,
  title,
  body,
  action,
  children,
  state,
}: {
  active: "overview" | "review" | "quality" | "health";
  title: string;
  body: string;
  action?: ReactNode;
  children: ReactNode;
  state?: "loading" | "ready" | "error";
}) {
  return (
    <main className="admin-page">
      <div className="admin-page-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="admin-brand-mark">
              <LayoutDashboard size={20} />
            </span>
            <div>
              <strong>Tumbuh Admin</strong>
              <small>Knowledge + AI Ops</small>
            </div>
          </div>

          <div className="admin-sidebar-card">
            <span className="admin-sidebar-kicker">Mode kerja</span>
            <strong>Panel operasional terpisah</strong>
            <p>
              Guardian flow tetap bersih. Tim operasional bisa fokus review knowledge, evaluasi jawaban AI, dan health context per child.
            </p>
          </div>

          <nav className="admin-sidebar-nav">
            <Link href="/backend" className={active === "overview" ? "is-active" : ""}>
              Overview
            </Link>
            <Link href="/backend/review" className={active === "review" ? "is-active" : ""}>
              Review Queue
            </Link>
            <Link href="/backend/quality" className={active === "quality" ? "is-active" : ""}>
              AI Quality
            </Link>
            <Link href="/backend/health" className={active === "health" ? "is-active" : ""}>
              Child Snapshot
            </Link>
          </nav>

          <Link href="/" className="admin-back-link">
            <ChevronLeft size={18} />
            Kembali ke app utama
          </Link>
        </aside>

        <section className="admin-main">
          <header className="admin-hero">
            <div>
              <span className="admin-hero-kicker">Separated dashboard</span>
              <h1>{title}</h1>
              <p>{body}</p>
            </div>
            {action}
          </header>

          {state === "error" && (
            <section className="admin-alert">
              <AlertTriangle size={20} />
              <div>
                <strong>Admin dashboard belum berhasil dimuat</strong>
                <p>Coba refresh lagi. Kalau tetap gagal, cek route admin dan auth dev.</p>
              </div>
            </section>
          )}

          {children}
        </section>
      </div>
    </main>
  );
}

export function AdminSection({
  eyebrow,
  title,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {meta ? <small>{meta}</small> : null}
      </div>
      <div className="admin-section-body">{children}</div>
    </section>
  );
}

export function OverviewCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "mint" | "blush" | "butter" | "sky";
}) {
  return (
    <article className={`admin-overview-card ${tone}`}>
      <span className="admin-overview-icon">{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  );
}

export function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="secondary-button" onClick={onClick}>
      <RefreshCcw size={18} />
      Refresh data
    </button>
  );
}
