"use client";

import Link from "next/link";
import { BrainCircuit, FileStack, ShieldCheck, Users } from "lucide-react";

import {
  AdminPageShell,
  OverviewCard,
  RefreshButton,
  useAdminDashboard,
} from "./admin-client";

export default function BackendOverviewPage() {
  const { dashboard, state, reload } = useAdminDashboard();

  return (
    <AdminPageShell
      active="overview"
      title="Panel operasional untuk knowledge, snapshot, dan mutu AI"
      body="Halaman ini jadi pintu masuk admin. Angka ringkas muncul di sini, sementara detail operasional dipisah ke halaman review, AI quality, dan child snapshot."
      state={state}
      action={<RefreshButton onClick={() => void reload()} />}
    >
      <section className="admin-overview-grid">
        <OverviewCard
          icon={<FileStack size={18} />}
          label="Artikel & chunk"
          value={
            dashboard
              ? `${dashboard.overview.articleCount}/${dashboard.overview.chunkCount}`
              : state === "loading"
                ? "..."
                : "0/0"
          }
          tone="mint"
        />
        <OverviewCard
          icon={<ShieldCheck size={18} />}
          label="Review tertunda"
          value={
            dashboard
              ? String(dashboard.overview.pendingReviewCount)
              : state === "loading"
                ? "..."
                : "0"
          }
          tone="butter"
        />
        <OverviewCard
          icon={<BrainCircuit size={18} />}
          label="Skor AI rata-rata"
          value={
            dashboard?.overview.averageOverallScore !== null &&
            dashboard?.overview.averageOverallScore !== undefined
              ? `${dashboard.overview.averageOverallScore}`
              : state === "loading"
                ? "..."
                : "-"
          }
          tone="sky"
        />
        <OverviewCard
          icon={<Users size={18} />}
          label="Child aktif"
          value={
            dashboard
              ? String(dashboard.overview.childCount)
              : state === "loading"
                ? "..."
                : "0"
          }
          tone="blush"
        />
      </section>

      <section className="admin-content-grid">
        <article className="admin-section">
          <div className="admin-section-head">
            <div>
              <span>Route utama</span>
              <h2>Pisah per halaman</h2>
            </div>
          </div>
          <div className="admin-section-body">
            <Link href="/backend/review" className="admin-nav-card">
              <strong>Review Queue</strong>
              <p>
                {dashboard
                  ? `${dashboard.reviewQueue.articles.length} artikel dan ${dashboard.reviewQueue.chunks.length} chunk perlu dilihat.`
                  : "Buka halaman khusus review artikel dan chunk knowledge."}
              </p>
            </Link>
            <Link href="/backend/quality" className="admin-nav-card">
              <strong>AI Quality</strong>
              <p>
                {dashboard
                  ? `${dashboard.overview.evaluationCount} evaluasi dan ${dashboard.overview.fallbackCount} fallback tercatat.`
                  : "Buka halaman evaluasi jawaban assistant dan hotspot issue."}
              </p>
            </Link>
            <Link href="/backend/health" className="admin-nav-card">
              <strong>Child Snapshot</strong>
              <p>
                {dashboard
                  ? `${dashboard.overview.childCount} child aktif punya health context yang bisa diinspeksi.`
                  : "Buka halaman health snapshot dan coverage context per child."}
              </p>
            </Link>
          </div>
        </article>

        <article className="admin-section">
          <div className="admin-section-head">
            <div>
              <span>Ringkas hari ini</span>
              <h2>Prioritas operasional</h2>
            </div>
          </div>
          <div className="admin-section-body">
            <article className="admin-empty-card">
              <strong>
                {dashboard
                  ? `${dashboard.overview.pendingReviewCount} review tertunda perlu diberesin lebih dulu`
                  : "Menentukan prioritas..."}
              </strong>
              <p>
                Mulai dari review knowledge yang belum approved, lalu cek evaluation dengan score rendah atau issue yang berulang.
              </p>
            </article>
          </div>
        </article>
      </section>
    </AdminPageShell>
  );
}
