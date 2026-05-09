"use client";

import { CheckCircle2 } from "lucide-react";

import {
  AdminPageShell,
  AdminSection,
  AdminKnowledgeArticle,
  AdminKnowledgeChunk,
  RefreshButton,
  apiRequest,
  formatDateTimeCompact,
  useAdminDashboard,
} from "../admin-client";
import { useState } from "react";

export default function BackendReviewPage() {
  const { dashboard, state, reload } = useAdminDashboard();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function patchArticleReview(articleId: string, reviewStatus: string) {
    try {
      setSavingKey(`article:${articleId}:${reviewStatus}`);
      await apiRequest<{ article: AdminKnowledgeArticle }>(`/api/admin/knowledge/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus,
          reviewNotes:
            reviewStatus === "approved"
              ? "Ditandai siap pakai dari admin panel."
              : "Perlu peninjauan ulang dari admin panel.",
        }),
      });
      await reload();
    } finally {
      setSavingKey(null);
    }
  }

  async function patchChunkReview(chunkId: string, reviewStatus: string) {
    try {
      setSavingKey(`chunk:${chunkId}:${reviewStatus}`);
      await apiRequest<{ chunk: AdminKnowledgeChunk }>(`/api/admin/knowledge/chunks/${chunkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus,
          reviewNotes:
            reviewStatus === "approved"
              ? "Chunk disetujui dari admin panel."
              : "Chunk perlu revisi atau review lanjutan.",
        }),
      });
      await reload();
    } finally {
      setSavingKey(null);
    }
  }

  const reviewArticles = dashboard?.reviewQueue.articles ?? [];
  const reviewChunks = dashboard?.reviewQueue.chunks ?? [];

  return (
    <AdminPageShell
      active="review"
      title="Review queue knowledge base"
      body="Halaman ini khusus untuk kurasi artikel dan chunk. Jadi tim tidak perlu melihat evaluasi AI atau snapshot child saat sedang fokus membereskan knowledge retrieval."
      state={state}
      action={<RefreshButton onClick={() => void reload()} />}
    >
      <section className="admin-content-grid">
        <AdminSection
          eyebrow="Artikel"
          title="Review artikel"
          meta={dashboard ? `${reviewArticles.length} artikel di antrean` : "Membaca artikel..."}
        >
          {reviewArticles.length === 0 ? (
            <article className="admin-empty-card">
              <strong>Tidak ada artikel tertunda</strong>
              <p>Semua artikel sudah punya review terbaru.</p>
            </article>
          ) : (
            reviewArticles.map((article) => (
              <article key={article.id} className="admin-review-row">
                <div className="admin-row-head">
                  <span className="admin-tag soft">Artikel</span>
                  <span className="admin-tag">{article.reviewStatus}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.category} • {article.chunkCount} chunk</p>
                <small>
                  Focus: {article.focusAreaTags.join(", ") || "Belum ada"} • Review: {formatDateTimeCompact(article.lastReviewedAt)}
                </small>
                <div className="admin-row-actions">
                  <button
                    className="secondary-button"
                    onClick={() => void patchArticleReview(article.id, "approved")}
                    disabled={savingKey === `article:${article.id}:approved`}
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button
                    className="text-button"
                    onClick={() => void patchArticleReview(article.id, "needs_review")}
                    disabled={savingKey === `article:${article.id}:needs_review`}
                  >
                    Needs review
                  </button>
                </div>
              </article>
            ))
          )}
        </AdminSection>

        <AdminSection
          eyebrow="Chunk"
          title="Review chunk"
          meta={dashboard ? `${reviewChunks.length} chunk di antrean` : "Membaca chunk..."}
        >
          {reviewChunks.length === 0 ? (
            <article className="admin-empty-card">
              <strong>Tidak ada chunk tertunda</strong>
              <p>Semua chunk sudah punya review terbaru.</p>
            </article>
          ) : (
            reviewChunks.map((chunk) => (
              <article key={chunk.id} className="admin-review-row">
                <div className="admin-row-head">
                  <span className="admin-tag soft">Chunk</span>
                  <span className="admin-tag">{chunk.reviewStatus}</span>
                </div>
                <h3>{chunk.article.title} #{chunk.chunkIndex + 1}</h3>
                <p>{chunk.chunkText.slice(0, 170)}...</p>
                <small>
                  Tags: {chunk.focusAreaTags.join(", ") || "Belum ada"} • Review: {formatDateTimeCompact(chunk.lastReviewedAt)}
                </small>
                <div className="admin-row-actions">
                  <button
                    className="secondary-button"
                    onClick={() => void patchChunkReview(chunk.id, "approved")}
                    disabled={savingKey === `chunk:${chunk.id}:approved`}
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button
                    className="text-button"
                    onClick={() => void patchChunkReview(chunk.id, "needs_review")}
                    disabled={savingKey === `chunk:${chunk.id}:needs_review`}
                  >
                    Needs review
                  </button>
                </div>
              </article>
            ))
          )}
        </AdminSection>
      </section>
    </AdminPageShell>
  );
}
