import { ArrowRight, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "./api";
import { Metric, Panel, WorkspaceHeader } from "./components";
import { backendContracts } from "./constants";
import type {
  AdminDashboardData,
  AdminDashboardResponse,
  AdminKnowledgeArticle,
  AdminKnowledgeChunk,
} from "./types";
import { cx, formatDateTimeCompact } from "./utils";

export function AdminDashboardScreen() {
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [adminState, setAdminState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [savingReviewKey, setSavingReviewKey] = useState<string | null>(null);
  const [activeContract, setActiveContract] = useState(
    backendContracts[0].endpoint,
  );

  async function loadAdminDashboard() {
    try {
      setAdminState("loading");
      const data =
        await apiRequest<AdminDashboardResponse>("/api/admin/dashboard");
      setAdminData(data.dashboard);
      setAdminState("ready");
    } catch (error) {
      console.error("Failed to load admin dashboard", error);
      setAdminState("error");
    }
  }

  useEffect(() => {
    void loadAdminDashboard();
  }, []);

  async function patchArticleReview(articleId: string, reviewStatus: string) {
    try {
      setSavingReviewKey(`article:${articleId}:${reviewStatus}`);
      await apiRequest<{ article: AdminKnowledgeArticle }>(
        `/api/admin/knowledge/articles/${articleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewStatus,
            reviewNotes:
              reviewStatus === "approved"
                ? "Ditandai siap pakai dari dashboard admin."
                : "Perlu ditinjau ulang dari dashboard admin.",
          }),
        },
      );
      await loadAdminDashboard();
    } catch (error) {
      console.error("Failed to update article review", error);
    } finally {
      setSavingReviewKey(null);
    }
  }

  async function patchChunkReview(chunkId: string, reviewStatus: string) {
    try {
      setSavingReviewKey(`chunk:${chunkId}:${reviewStatus}`);
      await apiRequest<{ chunk: AdminKnowledgeChunk }>(
        `/api/admin/knowledge/chunks/${chunkId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewStatus,
            reviewNotes:
              reviewStatus === "approved"
                ? "Chunk disetujui dari dashboard admin."
                : "Chunk perlu revisi atau review lanjutan.",
          }),
        },
      );
      await loadAdminDashboard();
    } catch (error) {
      console.error("Failed to update chunk review", error);
    } finally {
      setSavingReviewKey(null);
    }
  }

  const issueHotspots = adminData?.issueHotspots ?? [];
  const reviewArticles = adminData?.reviewQueue.articles ?? [];
  const reviewChunks = adminData?.reviewQueue.chunks ?? [];
  const evaluations = adminData?.latestEvaluations ?? [];
  const childHealth = adminData?.childHealth ?? [];

  return (
    <>
      <WorkspaceHeader
        title="Admin dashboard"
        body="Pantau mutu knowledge base, kualitas jawaban AI, dan kesehatan child snapshot dari satu tempat. Halaman ini membaca data backend nyata, bukan handoff statis."
        action={
          <button
            className="secondary-button"
            onClick={() => void loadAdminDashboard()}
          >
            Refresh admin <ArrowRight size={18} />
          </button>
        }
      />

      {adminState === "error" && (
        <Panel className="risk-panel">
          <CircleAlert size={24} />
          <div>
            <h2>Admin dashboard belum berhasil dimuat</h2>
            <p>
              Coba refresh lagi. Kalau tetap gagal, cek route admin dan koneksi
              database.
            </p>
          </div>
        </Panel>
      )}

      <div className="metrics-grid admin-metrics-grid">
        <Metric
          label="Review tertunda"
          value={
            adminData
              ? String(adminData.overview.pendingReviewCount)
              : adminState === "loading"
                ? "..."
                : "0"
          }
          tone="mint"
        />
        <Metric
          label="Skor evaluasi rata-rata"
          value={
            adminData?.overview.averageOverallScore !== null &&
            adminData?.overview.averageOverallScore !== undefined
              ? `${adminData.overview.averageOverallScore}`
              : adminState === "loading"
                ? "..."
                : "-"
          }
          tone="lavender"
        />
        <Metric
          label="Jawaban AI tercatat"
          value={
            adminData
              ? String(adminData.overview.responseLogCount)
              : adminState === "loading"
                ? "..."
                : "0"
          }
          tone="butter"
        />
        <Metric
          label="Fallback AI"
          value={
            adminData
              ? String(adminData.overview.fallbackCount)
              : adminState === "loading"
                ? "..."
                : "0"
          }
          tone="blush"
        />
      </div>

      <div className="admin-grid">
        <Panel className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-kicker">Knowledge review</span>
              <h2>Antrian review knowledge</h2>
            </div>
            <small>
              {adminData
                ? `${adminData.overview.articleCount} artikel • ${adminData.overview.chunkCount} chunk`
                : "Membaca library..."}
            </small>
          </div>

          {reviewArticles.length === 0 && reviewChunks.length === 0 ? (
            <div className="admin-empty">
              <strong>Tidak ada review tertunda</strong>
              <p>Semua artikel dan chunk sudah punya status review terbaru.</p>
            </div>
          ) : (
            <div className="admin-review-stack">
              {reviewArticles.map((article) => (
                <article key={article.id} className="admin-review-card">
                  <div className="admin-review-meta">
                    <span className="admin-badge soft">Artikel</span>
                    <span className="admin-badge">{article.reviewStatus}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>
                    {article.category} • {article.chunkCount} chunk
                  </p>
                  <small>
                    Focus: {article.focusAreaTags.join(", ") || "Belum ada tag"}{" "}
                    • Review terakhir:{" "}
                    {formatDateTimeCompact(article.lastReviewedAt)}
                  </small>
                  <div className="admin-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        void patchArticleReview(article.id, "approved")
                      }
                      disabled={
                        savingReviewKey === `article:${article.id}:approved`
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        void patchArticleReview(article.id, "needs_review")
                      }
                      disabled={
                        savingReviewKey === `article:${article.id}:needs_review`
                      }
                    >
                      Perlu review
                    </button>
                  </div>
                </article>
              ))}

              {reviewChunks.map((chunk) => (
                <article key={chunk.id} className="admin-review-card">
                  <div className="admin-review-meta">
                    <span className="admin-badge soft">Chunk</span>
                    <span className="admin-badge">{chunk.reviewStatus}</span>
                  </div>
                  <h3>
                    {chunk.article.title} #{chunk.chunkIndex + 1}
                  </h3>
                  <p>{chunk.chunkText.slice(0, 160)}...</p>
                  <small>
                    Tags: {chunk.focusAreaTags.join(", ") || "Belum ada"} •
                    Review terakhir: {formatDateTimeCompact(chunk.lastReviewedAt)}
                  </small>
                  <div className="admin-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        void patchChunkReview(chunk.id, "approved")
                      }
                      disabled={savingReviewKey === `chunk:${chunk.id}:approved`}
                    >
                      Approve
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        void patchChunkReview(chunk.id, "needs_review")
                      }
                      disabled={
                        savingReviewKey === `chunk:${chunk.id}:needs_review`
                      }
                    >
                      Perlu review
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-kicker">Assistant quality</span>
              <h2>Evaluasi jawaban AI</h2>
            </div>
            <small>
              {adminData
                ? `${adminData.overview.evaluationCount} evaluasi • ${adminData.overview.lowScoreCount} skor rendah`
                : "Menyiapkan evaluator..."}
            </small>
          </div>

          {issueHotspots.length > 0 ? (
            <div className="admin-hotspot-row">
              {issueHotspots.map((item) => (
                <span key={item.issue} className="admin-pill">
                  {item.issue} • {item.count}
                </span>
              ))}
            </div>
          ) : null}

          {evaluations.length === 0 ? (
            <div className="admin-empty">
              <strong>Belum ada evaluasi</strong>
              <p>
                Mulai percakapan dengan assistant agar evaluator otomatis punya
                data untuk dinilai.
              </p>
            </div>
          ) : (
            <div className="admin-eval-stack">
              {evaluations.map((evaluation) => (
                <article key={evaluation.id} className="admin-eval-card">
                  <div className="admin-eval-head">
                    <strong>{evaluation.childName || "Tanpa child"}</strong>
                    <span
                      className={cx(
                        "admin-score",
                        evaluation.overallScore < 75 && "is-low",
                      )}
                    >
                      {evaluation.overallScore}
                    </span>
                  </div>
                  <p>{evaluation.question}</p>
                  <small>
                    {evaluation.summary || "Belum ada ringkasan evaluator."}
                  </small>
                  <div className="admin-score-grid">
                    <span>Rel {evaluation.relevanceScore}</span>
                    <span>Safe {evaluation.safetyScore}</span>
                    <span>Faith {evaluation.faithfulnessScore}</span>
                    <span>Act {evaluation.actionabilityScore}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-kicker">Child context</span>
              <h2>Kesehatan snapshot anak</h2>
            </div>
            <small>
              {adminData
                ? `${adminData.overview.childCount} child aktif`
                : "Memuat child snapshot..."}
            </small>
          </div>

          {childHealth.length === 0 ? (
            <div className="admin-empty">
              <strong>Belum ada child aktif</strong>
              <p>
                Onboarding child dulu agar admin bisa melihat coverage snapshot
                dan health context.
              </p>
            </div>
          ) : (
            <div className="admin-health-stack">
              {childHealth.map((child) => (
                <article key={child.childId} className="admin-health-card">
                  <div className="admin-health-head">
                    <strong>{child.childName}</strong>
                    <span
                      className={cx(
                        "admin-badge",
                        child.snapshot?.sparseData && "warning",
                      )}
                    >
                      {child.snapshot?.sparseData
                        ? "Data tipis"
                        : "Siap dipakai"}
                    </span>
                  </div>
                  <p>
                    {child.snapshot?.summary ||
                      "Snapshot assistant belum dibuat. Jalankan assistant atau regenerate context."}
                  </p>
                  <div className="admin-health-meta">
                    <span>
                      Progress{" "}
                      {child.snapshot?.progressCount ?? child.progressCount}
                    </span>
                    <span>Roadmap {child.snapshot?.roadmapCount ?? 0}</span>
                    <span>
                      Insight{" "}
                      {child.snapshot?.hasWeeklyInsight ? "Ada" : "Belum"}
                    </span>
                    <span>
                      Update{" "}
                      {formatDateTimeCompact(child.snapshot?.updatedAt ?? null)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-kicker">Surface aktif</span>
              <h2>Kontrak API penting</h2>
            </div>
            <small>Ringkas, tapi tetap operasional</small>
          </div>
          <div className="handoff-grid compact">
            {backendContracts.map((contract) => (
              <button
                key={contract.endpoint}
                type="button"
                className={cx(
                  "contract-card",
                  activeContract === contract.endpoint && "selected",
                )}
                onClick={() => setActiveContract(contract.endpoint)}
              >
                <code>{contract.endpoint}</code>
                <h3>{contract.purpose}</h3>
                <p>{contract.fields}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="risk-panel">
        <CircleAlert size={24} />
        <div>
          <h2>Catatan etika produk</h2>
          <p>
            Assistant tetap wajib non-diagnostik. Review knowledge dan evaluasi
            otomatis ini dipakai untuk menjaga relevance, safety, faithfulness,
            dan actionability, bukan untuk memberi label klinis otomatis pada
            anak.
          </p>
        </div>
      </Panel>
    </>
  );
}
