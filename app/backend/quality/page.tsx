"use client";

import { AdminPageShell, AdminSection, RefreshButton, useAdminDashboard } from "../admin-client";

export default function BackendQualityPage() {
  const { dashboard, state, reload } = useAdminDashboard();
  const evaluations = dashboard?.latestEvaluations ?? [];
  const issueHotspots = dashboard?.issueHotspots ?? [];

  return (
    <AdminPageShell
      active="quality"
      title="AI quality dan evaluator"
      body="Halaman ini fokus ke mutu jawaban assistant: score evaluator, fallback, dan issue yang paling sering muncul. Tim bisa mengaudit kualitas tanpa tercampur antrean review knowledge."
      state={state}
      action={<RefreshButton onClick={() => void reload()} />}
    >
      <section className="admin-content-grid">
        <AdminSection
          eyebrow="Issue hotspot"
          title="Masalah yang paling sering muncul"
          meta={dashboard ? `${issueHotspots.length} hotspot aktif` : "Menganalisis issue..."}
        >
          {issueHotspots.length === 0 ? (
            <article className="admin-empty-card">
              <strong>Belum ada hotspot issue</strong>
              <p>Evaluator belum menemukan pola issue yang berulang.</p>
            </article>
          ) : (
            <div className="admin-hotspot-strip">
              {issueHotspots.map((item) => (
                <span key={item.issue} className="admin-chip">
                  {item.issue} • {item.count}
                </span>
              ))}
            </div>
          )}
        </AdminSection>

        <AdminSection
          eyebrow="Evaluasi"
          title="Daftar jawaban yang dinilai"
          meta={
            dashboard
              ? `${dashboard.overview.evaluationCount} evaluasi • ${dashboard.overview.fallbackCount} fallback`
              : "Menilai jawaban..."
          }
        >
          {evaluations.length === 0 ? (
            <article className="admin-empty-card">
              <strong>Belum ada evaluasi</strong>
              <p>Mulai percakapan assistant agar evaluator otomatis punya data untuk dinilai.</p>
            </article>
          ) : (
            evaluations.map((evaluation) => (
              <article key={evaluation.id} className="admin-eval-row">
                <div className="admin-row-head">
                  <strong>{evaluation.childName || "Tanpa child"}</strong>
                  <span className={`admin-score-pill ${evaluation.overallScore < 75 ? "low" : ""}`}>
                    {evaluation.overallScore}
                  </span>
                </div>
                <p>{evaluation.question}</p>
                <small>{evaluation.summary || "Belum ada ringkasan evaluator."}</small>
                <div className="admin-mini-metrics">
                  <span>Rel {evaluation.relevanceScore}</span>
                  <span>Safe {evaluation.safetyScore}</span>
                  <span>Faith {evaluation.faithfulnessScore}</span>
                  <span>Act {evaluation.actionabilityScore}</span>
                </div>
              </article>
            ))
          )}
        </AdminSection>
      </section>
    </AdminPageShell>
  );
}
