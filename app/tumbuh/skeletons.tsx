import { Panel, Skeleton, SkeletonText, WorkspaceHeader } from "./components";
import { dashboardGreeting } from "./personalize";

export function DashboardSkeleton({ guardianName }: { guardianName: string }) {
  return (
    <>
      {/* Hero skeleton */}
      <section className="dashboard-hero">
        <Skeleton width={280} height={28} radius={8} />
        <div style={{ marginTop: 12 }}>
          <Skeleton width="80%" height={14} radius={6} />
          <div style={{ height: 6 }} />
          <Skeleton width="55%" height={14} radius={6} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Skeleton width={150} height={44} radius={999} />
        </div>
      </section>

      {/* Body grid skeleton */}
      <div className="dashboard-body-grid">
        <Panel className="dashboard-daily-actions">
          <Skeleton width={200} height={18} radius={6} />
          <div className="daily-action-list">
            {Array.from({ length: 2 }).map((_, i) => (
              <div className="daily-action-item mint" key={i}>
                <div className="daily-action-text">
                  <Skeleton width="70%" height={14} radius={6} />
                  <div style={{ height: 6 }} />
                  <Skeleton width="90%" height={12} radius={6} />
                  <div style={{ height: 6 }} />
                  <Skeleton width={80} height={11} radius={6} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="dashboard-weekly-pulse">
          <Skeleton width={160} height={18} radius={6} />
          <div className="pulse-dots">
            {Array.from({ length: 7 }).map((_, i) => (
              <div className="pulse-day" key={i}>
                <Skeleton width={12} height={12} radius={999} />
                <Skeleton width={24} height={10} radius={4} />
              </div>
            ))}
          </div>
          <Skeleton width="75%" height={12} radius={6} />
        </Panel>

        <Panel className="dashboard-focus-targets">
          <Skeleton width={140} height={18} radius={6} />
          <div className="focus-target-list">
            {Array.from({ length: 2 }).map((_, i) => (
              <div className="focus-target-item" key={i}>
                <Skeleton width={56} height={56} radius={999} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="80%" height={14} radius={6} />
                  <div style={{ height: 6 }} />
                  <Skeleton width="50%" height={11} radius={6} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="dashboard-insight">
          <div className="insight-head">
            <Skeleton width={150} height={18} radius={6} />
            <Skeleton width={20} height={20} radius={6} />
          </div>
          <SkeletonText lines={3} />
          <Skeleton width={120} height={12} radius={6} />
        </Panel>
      </div>
    </>
  );
}

export function RoadmapSkeleton({ name }: { name: string }) {
  return (
    <>
      <WorkspaceHeader
        title={`Roadmap ${name}`}
        body="Memuat roadmap terbaru..."
      />
      <Panel className="roadmap-summary">
        <div>
          <Skeleton width={140} height={16} radius={6} />
          <SkeletonText lines={1} widths={["80%"]} />
        </div>
        <Skeleton width={140} height={8} radius={999} />
      </Panel>
      <div className="roadmap-layout">
        <Panel className="timeline-panel">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="timeline-item" key={i}>
              <Skeleton width={12} height={12} radius={999} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width={100} height={11} radius={6} />
                <div style={{ height: 6 }} />
                <Skeleton width="80%" height={16} radius={6} />
                <div style={{ height: 6 }} />
                <SkeletonText lines={2} widths={["100%", "65%"]} />
              </div>
            </div>
          ))}
        </Panel>
        <Panel className="decision-panel">
          <Skeleton width={180} height={18} radius={6} />
          <SkeletonText lines={3} />
        </Panel>
      </div>
    </>
  );
}

export function TimelineSkeleton() {
  return (
    <>
      <WorkspaceHeader
        title="Catat perkembangan hari ini"
        body="Memuat timeline catatan..."
      />
      <div className="progress-layout">
        <Panel className="entry-panel">
          <Skeleton width="100%" height={44} radius={12} />
          <div style={{ height: 12 }} />
          <SkeletonText lines={1} widths={["40%"]} />
          <Skeleton width="100%" height={140} radius={12} />
        </Panel>
        <Panel className="history-panel">
          <div className="panel-head">
            <Skeleton width={180} height={18} radius={6} />
            <Skeleton width={220} height={28} radius={999} />
          </div>
          <div className="entry-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <article className="entry-card" key={i}>
                <div>
                  <Skeleton width={60} height={18} radius={999} />
                  <div style={{ height: 8 }} />
                  <Skeleton width="70%" height={16} radius={6} />
                  <div style={{ height: 8 }} />
                  <SkeletonText lines={2} widths={["100%", "80%"]} />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
