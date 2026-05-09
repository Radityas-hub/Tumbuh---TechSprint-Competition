"use client";

import { ArrowRight, FileStack, Sparkles, Target } from "lucide-react";

import {
  AdminPageShell,
  AdminSection,
  RefreshButton,
  formatDateTimeCompact,
  useAdminDashboard,
} from "../admin-client";

export default function BackendHealthPage() {
  const { dashboard, state, reload } = useAdminDashboard();
  const childHealth = dashboard?.childHealth ?? [];

  return (
    <AdminPageShell
      active="health"
      title="Kesehatan child snapshot"
      body="Halaman ini fokus ke kualitas context yang dipakai assistant. Jadi tim bisa cepat lihat child mana yang snapshot-nya tipis, insight-nya belum cukup, atau progress-nya masih minim."
      state={state}
      action={<RefreshButton onClick={() => void reload()} />}
    >
      <section className="admin-content-grid">
        <AdminSection
          eyebrow="Snapshot"
          title="Health context per child"
          meta={dashboard ? `${dashboard.overview.childCount} child aktif` : "Membaca snapshot child..."}
        >
          {childHealth.length === 0 ? (
            <article className="admin-empty-card">
              <strong>Belum ada child aktif</strong>
              <p>Onboarding child dulu agar snapshot assistant dan evaluator punya context kerja.</p>
            </article>
          ) : (
            childHealth.map((child) => (
              <article key={child.childId} className="admin-health-row">
                <div className="admin-row-head">
                  <strong>{child.childName}</strong>
                  <span className={`admin-tag ${child.snapshot?.sparseData ? "warning" : ""}`}>
                    {child.snapshot?.sparseData ? "Data tipis" : "Siap dipakai"}
                  </span>
                </div>
                <p>
                  {child.snapshot?.summary ||
                    "Snapshot assistant belum dibuat. Jalankan assistant atau regenerate context."}
                </p>
                <div className="admin-mini-metrics">
                  <span><Target size={14} /> Progress {child.snapshot?.progressCount ?? child.progressCount}</span>
                  <span><FileStack size={14} /> Roadmap {child.snapshot?.roadmapCount ?? 0}</span>
                  <span><Sparkles size={14} /> Insight {child.snapshot?.hasWeeklyInsight ? "Ada" : "Belum"}</span>
                  <span><ArrowRight size={14} /> {formatDateTimeCompact(child.snapshot?.updatedAt ?? null)}</span>
                </div>
              </article>
            ))
          )}
        </AdminSection>
      </section>
    </AdminPageShell>
  );
}
