import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  LogIn,
  Plus,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  dashboardGreeting,
  dashboardNarrative,
  insightFallbackText,
  toChildContext,
  weeklyPulseNarrative,
  childReferenceName,
} from "./personalize";
import { QuickNote } from "./QuickNote";
import { ProductTour } from "./ProductTour";
import { MobileFab } from "./MobileFab";
import { DashboardSkeleton } from "./skeletons";
import type {
  ChildApiModel,
  ChildProfile,
  DashboardData,
  DashboardFocusTarget,
  ProgressEntry,
  Area,
  Screen,
} from "./types";

export function Dashboard({
  profile,
  go,
  guardianName,
  dashboardData,
  isAuthenticated,
  isLoading,
  activeChild,
  onAddEntry,
}: {
  profile: ChildProfile;
  go: (screen: Screen) => void;
  guardianName: string;
  dashboardData: DashboardData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeChild: ChildApiModel | null;
  onAddEntry?: (entry: {
    area: Area;
    inputType: ProgressEntry["type"];
    note: string;
    title?: string;
    file?: File | null;
  }) => Promise<void>;
}) {
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);

  if (isLoading) {
    return <DashboardSkeleton guardianName={guardianName} />;
  }

  const ctx = toChildContext(profile, activeChild);
  const childName = childReferenceName(ctx);
  const hasDashboardData = Boolean(
    dashboardData && !dashboardData.meta.shouldUsePlaceholder,
  );

  const openQuickNote = () => {
    if (onAddEntry) {
      setQuickNoteOpen(true);
    } else {
      go("progress");
    }
  };

  if (!hasDashboardData) {
    return (
      <>
        <DashboardEmpty
          guardianName={guardianName}
          ctx={ctx}
          go={go}
          isAuthenticated={isAuthenticated}
          onAddNote={openQuickNote}
        />
        {onAddEntry && (
          <QuickNote
            open={quickNoteOpen}
            onClose={() => setQuickNoteOpen(false)}
            onSubmit={onAddEntry}
            childName={childName}
          />
        )}
        <ProductTour variant="empty" />
      </>
    );
  }

  const activities = dashboardData?.activities ?? [];
  const spotlight = dashboardData?.spotlight ?? null;
  const focusTargets = dashboardData?.focusTargets ?? [];
  const dailyDots = dashboardData?.dailyDots ?? [];
  const todayIndex = dashboardData?.meta.todayIndex ?? 6;
  const latestInsight = dashboardData?.latestInsight;
  const notesThisWeek = dashboardData?.metrics.notesThisWeek ?? 0;
  const delta = dashboardData?.trend.delta ?? 0;
  const alertCount = dashboardData?.metrics.alertCount ?? 0;
  const achievedTargets = dashboardData?.metrics.achievedTargets ?? 0;

  const closestTarget =
    focusTargets.length > 0 && focusTargets[0].progressPercent >= 70
      ? focusTargets[0].title
      : null;

  const narrative = dashboardNarrative(ctx, {
    notesThisWeek,
    delta,
    alertCount,
    achievedTargets,
    closestTarget,
  });

  const insightSummary = latestInsight?.summary || insightFallbackText(ctx);
  const insightStatus = latestInsight?.status ?? "EMPTY";
  const insightMeta =
    insightStatus === "PENDING"
      ? "Sedang menyusun ringkasan dari catatan terbaru..."
      : latestInsight?.generatedAt
        ? `Diperbarui ${new Date(latestInsight.generatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`
        : "";

  return (
    <div className="dash">
      {/* Hero — full width, with illustration */}
      <section className="dash-hero">
        <div className="dash-hero-content">
          <h1>{dashboardGreeting(new Date().getHours(), guardianName)}</h1>
          <p>{narrative}</p>
          <button className="primary-button" onClick={openQuickNote}>
            <Plus size={18} /> Catat hari ini
          </button>
        </div>
        <div className="dash-hero-img">
          <Image
            src="/images/dashboard.png"
            alt=""
            width={180}
            height={180}
            priority
          />
        </div>
      </section>

      {/* Spotlight — only rendered when there's actual alert data */}
      {spotlight && spotlight.message && (
        <section className="dash-spotlight">
          <span className="dash-spotlight-icon">
            <AlertTriangle size={18} />
          </span>
          <div className="dash-spotlight-body">
            <strong>Perlu perhatian</strong>
            <p>{spotlight.message}</p>
            <div className="dash-spotlight-links">
              <button className="text-button" onClick={() => go("roadmap")}>
                Lihat insight <ChevronRight size={14} />
              </button>
              <button className="text-button" onClick={() => go("consultation")}>
                Siapkan konsultasi <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Fresh layout: asymmetric bento-style grid */}
      <div className="dash-bento">
        {/* Left column — tall: daily actions stacked with pulse */}
        <div className="dash-col-left">
          {/* Daily actions — no card wrapper, just content */}
          <div className="dash-actions">
            <h2>Yang bisa dilakukan hari ini</h2>
            {activities.length === 0 ? (
              <div className="dash-action-item">
                <div>
                  <strong>Tambahkan catatan pertama</strong>
                  <p>Satu kalimat tentang apa yang Anda perhatikan sudah cukup.</p>
                </div>
                <button className="ghost-button" onClick={openQuickNote}>
                  Catat
                </button>
              </div>
            ) : (
              activities.slice(0, 2).map((activity) => (
                <div className="dash-action-item" key={activity.title}>
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.body}</p>
                    <small className={`dash-area-tag ${areaToTone(activity.area)}`}>
                      {activity.area}
                    </small>
                  </div>
                  <button className="ghost-button" onClick={openQuickNote}>
                    <CheckCircle2 size={14} /> Sudah
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Weekly pulse — inline, compact */}
          <div className="dash-pulse">
            <div className="dash-pulse-header">
              <h3>Ritme minggu ini</h3>
              <button className="text-button" onClick={() => go("progress")}>
                Semua catatan <ChevronRight size={14} />
              </button>
            </div>
            <div className="dash-pulse-dots">
              {getWeekdayLabels(todayIndex).map((day, index) => (
                <div className="dash-dot-col" key={`${day}-${index}`}>
                  <span
                    className={`dash-dot ${
                      index > todayIndex
                        ? "future"
                        : dailyDots[index]
                          ? "filled"
                          : "empty"
                    }`}
                  />
                  <small>{day}</small>
                </div>
              ))}
            </div>
            <p className="dash-pulse-text">
              {weeklyPulseNarrative(ctx, { notesThisWeek, delta, todayIndex })}
            </p>
          </div>
        </div>

        {/* Right column — focus targets + insight stacked */}
        <div className="dash-col-right">
          {/* Focus targets — visual with arcs */}
          <div className="dash-focus">
            <h2>Fokus saat ini</h2>
            {focusTargets.length > 0 ? (
              <div className="dash-focus-list">
                {focusTargets.map((target) => (
                  <FocusTargetItem key={target.id} target={target} />
                ))}
              </div>
            ) : (
              <p className="dash-focus-empty">
                Target muncul setelah roadmap terbentuk dari catatan Anda.
              </p>
            )}
            <button className="text-button" onClick={() => go("roadmap")}>
              Lihat semua target <ChevronRight size={14} />
            </button>
          </div>

          {/* Insight — expandable */}
          <InsightCard
            summary={insightSummary}
            meta={insightMeta}
            status={insightStatus}
            go={go}
          />
        </div>
      </div>

      {/* Auth reminder */}
      {!isAuthenticated && (
        <section className="dash-auth-reminder">
          <div>
            <strong>Simpan progres di akun Anda</strong>
            <p>Catatan dan roadmap disimpan permanen setelah akun ditautkan.</p>
          </div>
          <Link className="secondary-button" href="/login">
            <LogIn size={16} /> Masuk
          </Link>
        </section>
      )}

      {/* Quick note modal */}
      {onAddEntry && (
        <QuickNote
          open={quickNoteOpen}
          onClose={() => setQuickNoteOpen(false)}
          onSubmit={onAddEntry}
          childName={childName}
        />
      )}

      {/* Mobile-only FAB — thumb zone primary action */}
      <MobileFab onClick={openQuickNote} />

      {/* Product tour — shows once on first visit with data */}
      <ProductTour variant="full" />
    </div>
  );
}

function DashboardEmpty({
  guardianName: _guardianName,
  ctx,
  go: _go,
  isAuthenticated,
  onAddNote,
}: {
  guardianName: string;
  ctx: ReturnType<typeof toChildContext>;
  go: (screen: Screen) => void;
  isAuthenticated: boolean;
  onAddNote: () => void;
}) {
  const childName = ctx.name?.trim() || "anak Anda";

  return (
    <div className="dash">
      <section className="dash-empty">
        <div className="dash-empty-visual">
          <Image
            src="/images/empty_dashboard.png"
            alt="Ilustrasi belum ada catatan"
            width={260}
            height={260}
            priority
          />
        </div>
        <div className="dash-empty-content">
          <h1>Belum ada catatan untuk {childName}</h1>
          <p>
            Mulai dari satu momen kecil hari ini. Tidak perlu panjang — satu
            kalimat tentang apa yang Anda perhatikan sudah cukup.
          </p>
          <button className="primary-button" onClick={onAddNote}>
            <Plus size={18} /> Mulai mencatat
          </button>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="dash-auth-reminder">
          <div>
            <strong>Simpan progres di akun Anda</strong>
            <p>Catatan dan roadmap disimpan permanen setelah akun ditautkan.</p>
          </div>
          <Link className="secondary-button" href="/login">
            <LogIn size={16} /> Masuk
          </Link>
        </section>
      )}
    </div>
  );
}

function FocusTargetItem({ target }: { target: DashboardFocusTarget }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (target.progressPercent / 100) * circumference;
  const areaColor = areaToStroke(target.area);

  return (
    <div className="dash-target-item">
      <svg className="dash-arc" width="52" height="52" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--surface-solid)"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={areaColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 28 28)"
        />
        <text
          x="28"
          y="28"
          textAnchor="middle"
          dominantBaseline="central"
          className="dash-arc-label"
        >
          {target.progressPercent}%
        </text>
      </svg>
      <div className="dash-target-text">
        <strong>{target.title}</strong>
        <small>{target.area} · {target.statusLabel}</small>
      </div>
    </div>
  );
}

function InsightCard({
  summary,
  meta,
  status,
  go,
}: {
  summary: string;
  meta: string;
  status: string;
  go: (screen: Screen) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="dash-insight">
      <div className="dash-insight-head">
        <h3>Ringkasan catatan</h3>
        <Sparkles size={18} />
      </div>
      <p className={`dash-insight-text ${expanded ? "expanded" : "collapsed"}`}>
        {summary}
      </p>
      {summary.length > 150 && (
        <button className="text-button" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Tutup" : "Baca selengkapnya"}{" "}
          <ChevronDown
            size={14}
            style={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 200ms ease",
            }}
          />
        </button>
      )}
      {meta && <small className="dash-insight-meta">{meta}</small>}
      {status !== "EMPTY" && (
        <button className="text-button" onClick={() => go("roadmap")}>
          Dampak ke roadmap <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function areaToTone(area: string): string {
  switch (area) {
    case "Komunikasi": return "mint";
    case "Motorik": return "blue";
    case "Perilaku": return "amber";
    case "Akademik": return "coral";
    default: return "mint";
  }
}

function areaToStroke(area: string): string {
  switch (area) {
    case "Komunikasi": return "var(--teal)";
    case "Motorik": return "var(--blue)";
    case "Perilaku": return "var(--amber)";
    case "Akademik": return "var(--coral)";
    default: return "var(--teal)";
  }
}

/**
 * Compute weekday labels for the 7-day window based on todayIndex.
 */
function getWeekdayLabels(todayIndex: number): string[] {
  const allDays = ["M", "S", "S", "R", "K", "J", "S"];
  const todayJsDay = new Date().getDay();

  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const daysBeforeToday = todayIndex - i;
    const jsDay = ((todayJsDay - daysBeforeToday) % 7 + 7) % 7;
    labels.push(allDays[jsDay]);
  }
  return labels;
}
