import {
  Activity,
  ChevronRight,
  LineChart,
  LogIn,
  Plus,
  Sparkles,
  TimerReset,
  Utensils,
} from "lucide-react";
import Link from "next/link";

import {
  Metric,
  Panel,
  RoadmapStrip,
  WorkspaceHeader,
} from "./components";
import { dashboardInstructionRoadmap } from "./constants";
import {
  chartPanelSubtitle,
  dashboardBody,
  dashboardGreeting,
  insightFallbackText,
  personalizedActivityPlaceholders,
  toChildContext,
} from "./personalize";
import { DashboardSkeleton } from "./skeletons";
import type {
  ChildApiModel,
  ChildProfile,
  DashboardData,
  Screen,
} from "./types";
import { getChartBarHeight } from "./utils";

export function Dashboard({
  profile,
  go,
  guardianName,
  dashboardData,
  isAuthenticated,
  isLoading,
  activeChild,
}: {
  profile: ChildProfile;
  go: (screen: Screen) => void;
  guardianName: string;
  dashboardData: DashboardData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeChild: ChildApiModel | null;
}) {
  if (isLoading) {
    return <DashboardSkeleton guardianName={guardianName} />;
  }

  const ctx = toChildContext(profile, activeChild);
  const hasDashboardData = Boolean(
    dashboardData && !dashboardData.meta.shouldUsePlaceholder,
  );
  const chart = hasDashboardData ? (dashboardData?.chart ?? []) : [];
  const maxChartValue = Math.max(...chart.map((item) => item.value), 0);
  const activities = hasDashboardData
    ? (dashboardData?.activities ?? [])
    : personalizedActivityPlaceholders(ctx);
  const roadmapPreview = hasDashboardData
    ? (dashboardData?.roadmapPreview ?? [])
    : [];
  const latestInsight =
    dashboardData?.latestInsight?.summary || insightFallbackText(ctx);
  const latestInsightStatus = hasDashboardData
    ? (dashboardData?.latestInsight?.status ?? "EMPTY")
    : "EMPTY";
  const latestInsightMeta =
    latestInsightStatus === "PENDING"
      ? "Insight sedang diperbarui dari catatan terbaru."
      : latestInsightStatus === "STALE"
        ? "Ada data baru. Insight terakhir masih ditampilkan sambil menunggu pembaruan."
        : latestInsightStatus === "FAILED"
          ? "Pembaruan insight terakhir gagal. Ringkasan sebelumnya tetap ditampilkan."
          : dashboardData?.latestInsight?.generatedAt
            ? `Insight terakhir diperbarui ${new Date(dashboardData.latestInsight.generatedAt).toLocaleString("id-ID")}.`
            : "Panel ini akan berisi ringkasan otomatis begitu ada catatan baru.";

  return (
    <>
      <WorkspaceHeader
        title={dashboardGreeting(new Date().getHours(), guardianName)}
        body={dashboardBody(ctx, hasDashboardData)}
        action={
          isAuthenticated ? (
            <button className="primary-button" onClick={() => go("progress")}>
              <Plus size={18} /> Catat perkembangan
            </button>
          ) : (
            <Link className="primary-button" href="/login">
              <LogIn size={16} /> Tautkan akun
            </Link>
          )
        }
      />
      {!isAuthenticated ? (
        <Panel className="auth-reminder">
          <div>
            <strong>Simpan progres anak di akun Anda</strong>
            <p>
              Catatan, foto, dan roadmap baru bisa disimpan permanen setelah
              akun ditautkan. Saat ini Anda sedang menjelajahi dashboard dalam
              mode tamu.
            </p>
          </div>
          <Link className="secondary-button" href="/login">
            <LogIn size={16} /> Masuk atau daftar
          </Link>
        </Panel>
      ) : null}
      <div className="metric-grid">
        <Metric
          label="Catatan minggu ini"
          value={
            hasDashboardData
              ? String(dashboardData?.metrics.notesThisWeek ?? 0)
              : "—"
          }
          tone="green"
        />
        <Metric
          label="Aktivitas selesai"
          value={
            hasDashboardData
              ? String(dashboardData?.metrics.completedActivities ?? 0)
              : "—"
          }
          tone="blue"
        />
        <Metric
          label="Target tercapai"
          value={
            hasDashboardData
              ? String(dashboardData?.metrics.achievedTargets ?? 0)
              : "—"
          }
          tone="amber"
        />
        <Metric
          label="Alert penting"
          value={
            hasDashboardData
              ? String(dashboardData?.metrics.alertCount ?? 0)
              : "—"
          }
          tone="coral"
        />
      </div>
      <div className="dashboard-grid">
        <Panel className="wide-panel">
          <div className="panel-head">
            <div>
              <h2>Progress mingguan</h2>
              <p>{chartPanelSubtitle(ctx, hasDashboardData)}</p>
            </div>
            {hasDashboardData ? (
              <span className="trend-up">{dashboardData?.trend.label}</span>
            ) : null}
          </div>
          {chart.length > 0 ? (
            <div className="chart-modern">
              {chart.map((point, index) => (
                <div key={`${point.label}-${index}`} className="bar-column">
                  <span
                    style={{
                      height: `${getChartBarHeight(point.value, maxChartValue)}%`,
                    }}
                  />
                  <small>{point.label}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-instruction-list">
              <div className="dashboard-instruction-card">
                <strong>Tambahkan catatan harian</strong>
                <p>
                  Masukkan 2-3 observasi rutin agar grafik pola mingguan mulai
                  terbentuk.
                </p>
              </div>
              <div className="dashboard-instruction-card">
                <strong>Gunakan area yang konsisten</strong>
                <p>
                  Pilih area perkembangan yang sama supaya grafik mudah
                  dibandingkan dari minggu ke minggu.
                </p>
              </div>
            </div>
          )}
        </Panel>
        <Panel>
          <div className="panel-head compact">
            <h2>AI insight</h2>
            <Sparkles size={22} />
          </div>
          <p className="insight-text">{latestInsight}</p>
          <small>{latestInsightMeta}</small>
          <button className="text-button" onClick={() => go("roadmap")}>
            Lihat dampak ke roadmap <ChevronRight size={18} />
          </button>
        </Panel>
        <Panel>
          <h2>Aktivitas hari ini</h2>
          <div className="activity-list">
            {hasDashboardData && activities.length === 0 && (
              <div className="activity-row">
                <div>
                  <strong>Belum ada aktivitas rekomendasi</strong>
                  <p>
                    Tambahkan catatan perkembangan agar rekomendasi aktivitas
                    bisa disusun.
                  </p>
                </div>
              </div>
            )}
            {activities.map((activity) => (
              <div className="activity-row" key={activity.title}>
                <span>
                  {activity.area === "Perilaku" ? (
                    <TimerReset size={20} />
                  ) : activity.area === "Komunikasi" ? (
                    <Activity size={20} />
                  ) : activity.area === "Motorik" ? (
                    <LineChart size={20} />
                  ) : (
                    <Utensils size={20} />
                  )}
                </span>
                <div>
                  <strong>{activity.title}</strong>
                  <p>{activity.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="wide-panel roadmap-preview">
          <div className="panel-head">
            <div>
              <h2>Roadmap perkembangan</h2>
              <p>
                {roadmapPreview.length > 0
                  ? "Urutan milestone paling relevan untuk minggu ini."
                  : "Baseline yang akan bergeser seiring catatan perkembangan yang Anda tambahkan."}
              </p>
            </div>
            <button className="secondary-button" onClick={() => go("roadmap")}>
              Buka roadmap
            </button>
          </div>
          {roadmapPreview.length > 0 ? (
            <RoadmapStrip items={roadmapPreview} />
          ) : (
            <div className="dashboard-instruction-list">
              {dashboardInstructionRoadmap.map((item) => (
                <div key={item.title} className="dashboard-instruction-card">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
