import { Panel, Skeleton, SkeletonText, WorkspaceHeader } from "./components";
import { dashboardGreeting } from "./personalize";

export function DashboardSkeleton({ guardianName }: { guardianName: string }) {
  return (
    <>
      <WorkspaceHeader
        title={dashboardGreeting(new Date().getHours(), guardianName)}
        body="Memuat data terbaru..."
      />
      <div className="metric-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="metric-card is-skeleton" aria-hidden>
            <Skeleton width={56} height={26} radius={6} />
            <Skeleton width="70%" height={12} radius={6} />
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel className="wide-panel">
          <div className="panel-head">
            <div className="panel-skeleton-head">
              <Skeleton width={180} height={18} radius={6} />
              <Skeleton width="60%" height={12} radius={6} />
            </div>
            <Skeleton width={68} height={24} radius={999} />
          </div>
          <div className="skeleton-chart">
            {[40, 65, 30, 85, 50, 70, 45].map((h, i) => (
              <Skeleton key={i} height={`${h}%`} />
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="panel-head compact">
            <Skeleton width={110} height={18} radius={6} />
            <Skeleton width={22} height={22} radius={6} />
          </div>
          <SkeletonText lines={4} />
          <Skeleton width="40%" height={12} radius={6} />
          <Skeleton width={160} height={14} radius={6} />
        </Panel>
        <Panel>
          <Skeleton width={140} height={18} radius={6} />
          <div className="activity-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="skeleton-row" key={i}>
                <Skeleton className="skeleton-avatar" />
                <SkeletonText lines={2} widths={["70%", "90%"]} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="wide-panel">
          <div className="panel-head">
            <div className="panel-skeleton-head">
              <Skeleton width={200} height={18} radius={6} />
              <Skeleton width="55%" height={12} radius={6} />
            </div>
            <Skeleton width={120} height={34} radius={16} />
          </div>
          <div className="roadmap-strip">
            {Array.from({ length: 4 }).map((_, i) => (
              <article className="strip-item" key={i}>
                <Skeleton width={10} height={10} radius={999} />
                <Skeleton width="85%" height={14} radius={6} />
                <Skeleton width="55%" height={11} radius={6} />
              </article>
            ))}
          </div>
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
