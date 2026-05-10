import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Clock,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { apiRequest } from "./api";
import { Panel, WorkspaceHeader } from "./components";
import {
  assistantInitialPrompt,
  conditionPhrase,
  educationHeaderBody,
  toChildContext,
} from "./personalize";
import type {
  ArticleApiModel,
  ArticlesResponse,
  AssistantChatResponse,
  ChildApiModel,
  ChildProfile,
  UiArticleSummary,
} from "./types";
import { mapArticleToUi } from "./utils";

function rankByRelevance(
  articles: UiArticleSummary[],
  condition: string | null | undefined,
  focusAreas: string[],
) {
  if (!condition && focusAreas.length === 0) return articles;
  const conditionLower = condition?.toLowerCase() ?? "";
  const focusLower = focusAreas.map((area) => area.toLowerCase());

  return [...articles].sort((a, b) => {
    const score = (article: UiArticleSummary) => {
      const haystack = `${article.title} ${article.body} ${article.category}`.toLowerCase();
      let pts = 0;
      if (conditionLower && haystack.includes(conditionLower.split(" ")[0])) pts += 3;
      focusLower.forEach((area) => {
        if (haystack.includes(area)) pts += 1;
      });
      return pts;
    };
    return score(b) - score(a);
  });
}

export function Education({
  activeChildId,
  profile,
  activeChild,
}: {
  activeChildId: string | null;
  profile: ChildProfile;
  activeChild: ChildApiModel | null;
}) {
  const ctx = toChildContext(profile, activeChild);
  const [searchQuery, setSearchQuery] = useState("");
  const [articleItems, setArticleItems] = useState<UiArticleSummary[]>([]);
  const [activeArticle, setActiveArticle] = useState<UiArticleSummary | null>(
    null,
  );
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isAsking, setIsAsking] = useState(false);
  const [assistantConversationId, setAssistantConversationId] = useState<
    string | null
  >(null);
  const [detailArticle, setDetailArticle] = useState<ArticleApiModel | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAsking]);

  function openArticleDetail(article: UiArticleSummary) {
    if (!article.slug) {
      setActiveArticle(article);
      return;
    }
    setIsLoadingDetail(true);
    void apiRequest<{ article: ArticleApiModel }>(`/api/articles/${article.slug}`)
      .then((data) => {
        setDetailArticle(data.article);
      })
      .catch((error) => {
        console.error("Failed to load article detail", error);
        setActiveArticle(article);
      })
      .finally(() => {
        setIsLoadingDetail(false);
      });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      try {
        const searchParams = new URLSearchParams();
        if (searchQuery.trim()) {
          searchParams.set("query", searchQuery.trim());
        }

        const data = await apiRequest<ArticlesResponse>(
          `/api/articles${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
        );

        if (cancelled) return;

        const mapped = data.articles.map(mapArticleToUi);
        const next = searchQuery.trim()
          ? mapped
          : rankByRelevance(
              mapped,
              conditionPhrase(ctx),
              ctx.focusAreas ?? [],
            );
        setArticleItems(next);
        setActiveArticle(next[0] ?? null);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load articles", error);
        }
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, ctx.condition, (ctx.focusAreas ?? []).join(",")]);

  const askAssistant = () => {
    const trimmed = question.trim();
    if (!trimmed || isAsking) return;

    setChatMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");
    setIsAsking(true);

    void apiRequest<AssistantChatResponse>("/api/assistant/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        childId: activeChildId,
        conversationId: assistantConversationId,
        question: trimmed,
      }),
    })
      .then((response) => {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.reply },
        ]);
        setAssistantConversationId(response.conversation.id);
      })
      .catch((error) => {
        console.error("Failed to ask assistant", error);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Pertanyaan belum berhasil dikirim. Coba lagi sebentar lagi. Jawaban assistant tetap bukan diagnosis.",
          },
        ]);
      })
      .finally(() => {
        setIsAsking(false);
      });
  };

  return (
    <>
      <WorkspaceHeader
        title="Edukasi dan AI assistant"
        body={educationHeaderBody(ctx)}
      />

      {detailArticle ? (
        <ArticleDetail
          article={detailArticle}
          onBack={() => setDetailArticle(null)}
        />
      ) : (
      <div className="education-layout">
        <Panel className="article-panel">
          <div className="search-box">
            <Search size={18} />
            <input
              aria-label="Cari artikel"
              placeholder="Cari autisme, rutinitas visual, speech delay"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          {isLoadingDetail && (
            <div className="article-loading">Memuat artikel...</div>
          )}
          <div className="article-grid">
            {articleItems.length === 0 && (
              <article className="article-card">
                <span>Belum ada hasil</span>
                <h3>Artikel belum ditemukan</h3>
                <p>
                  Coba kata kunci lain atau tunggu backend memuat artikel
                  edukasi.
                </p>
              </article>
            )}
            {articleItems.map((article) => (
              <article key={article.title} className="article-card">
                <span>
                  {article.category} • {article.readTime}
                </span>
                <h3>{article.title}</h3>
                <p>{article.body}</p>
                <button
                  className="text-button article-action"
                  onClick={() => openArticleDetail(article)}
                >
                  Baca ringkasan <ChevronRight size={18} />
                </button>
              </article>
            ))}
          </div>
          <div className="article-summary">
            <BookOpen size={20} />
            <div>
              <strong>
                {activeArticle?.title ?? "Ringkasan artikel akan tampil di sini"}
              </strong>
              <p>
                {activeArticle?.body ??
                  "Pilih artikel dari daftar untuk melihat ringkasan singkat yang relevan."}
              </p>
            </div>
          </div>
        </Panel>
        <Panel className="assistant-panel">
          <div className="assistant-head">
            <BrainCircuit size={24} />
            <h2>Tanya Tumbuh AI</h2>
          </div>
          <div className="chat-thread">
            {chatMessages.length === 0 && (
              <p className="chat ai">{assistantInitialPrompt(ctx)}</p>
            )}
            {chatMessages.map((msg, index) => (
              <p key={index} className={`chat ${msg.role === "user" ? "user" : "ai"}`}>
                {msg.content}
              </p>
            ))}
            {isAsking && (
              <p className="chat ai typing">Sedang menyusun jawaban...</p>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="assistant-input">
            <input
              aria-label="Tulis pertanyaan"
              placeholder="Tulis pertanyaan orang tua"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") askAssistant();
              }}
              disabled={isAsking}
            />
            <button aria-label="Kirim pertanyaan" onClick={askAssistant} disabled={isAsking}>
              <ArrowRight size={18} />
            </button>
          </div>
        </Panel>
      </div>
      )}
    </>
  );
}

function ArticleDetail({
  article,
  onBack,
}: {
  article: ArticleApiModel;
  onBack: () => void;
}) {
  return (
    <div className="article-detail">
      <button className="text-button article-back" onClick={onBack}>
        <ArrowLeft size={16} /> Kembali ke artikel
      </button>

      <article className="article-detail-content">
        <header className="article-detail-header">
          <span className="article-detail-meta">
            {article.category}
          </span>
          <h1>{article.title}</h1>
          <p className="article-detail-summary">{article.summary}</p>
          <div className="article-detail-info">
            <span><Clock size={14} /> {article.readTime} menit baca</span>
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </header>

        <div className="article-detail-body">
          {article.content.split("\n").filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <footer className="article-detail-footer">
          <div className="article-detail-disclaimer">
            <BookOpen size={16} />
            <span>
              Artikel ini bersifat panduan observasi dan bukan pengganti konsultasi profesional.
            </span>
          </div>
        </footer>
      </article>
    </div>
  );
}
