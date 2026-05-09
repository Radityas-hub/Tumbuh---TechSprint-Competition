"use client";

import { useRef } from "react";

import { AdminDashboardScreen } from "./tumbuh/AdminDashboard";
import { AppShell } from "./tumbuh/AppShell";
import { Consultation } from "./tumbuh/Consultation";
import { Dashboard } from "./tumbuh/Dashboard";
import { Education } from "./tumbuh/Education";
import { Header } from "./tumbuh/Header";
import { Landing } from "./tumbuh/Landing";
import { Onboarding } from "./tumbuh/Onboarding";
import { Progress } from "./tumbuh/Progress";
import { Roadmap } from "./tumbuh/Roadmap";
import { Settings } from "./tumbuh/Settings";
import type { Screen } from "./tumbuh/types";
import { useLandingAnimations } from "./tumbuh/useLandingAnimations";
import { useTumbuhSession } from "./tumbuh/useTumbuhSession";
import { cx, getChildRoutine, getChildSupportNeed } from "./tumbuh/utils";

export default function TumbuhApp({
  initialScreen = "home",
}: {
  initialScreen?: Screen;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const session = useTumbuhSession(initialScreen);

  useLandingAnimations(rootRef, session.screen);

  const {
    screen,
    profile,
    setProfile,
    timelineEntries,
    mobileOpen,
    setMobileOpen,
    selectedArea,
    setSelectedArea,
    guardian,
    guardianName,
    isAuthenticated,
    isDashboardLoading,
    isRoadmapLoading,
    isTimelineLoading,
    activeChildId,
    activeChild,
    dashboardData,
    roadmapItems,
    roadmapMeta,
    primaryStartHref,
    go,
    handleOnboardingComplete,
    handleProgressCreate,
    handleProgressUpdate,
    handleProgressDelete,
    handleRoadmapUpdate,
    handleDataClearedRefresh,
  } = session;

  return (
    <main
      ref={rootRef}
      className={cx("app-root", screen === "onboarding" && "onboarding-mode")}
    >
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {screen === "home" && (
        <Header
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          startHref={primaryStartHref}
        />
      )}

      {screen === "home" && <Landing go={go} startHref={primaryStartHref} />}

      {screen === "onboarding" && (
        <Onboarding
          profile={profile}
          setProfile={setProfile}
          go={go}
          onComplete={handleOnboardingComplete}
          initialRoutine={getChildRoutine(activeChild)}
          initialSupportNeed={getChildSupportNeed(activeChild)}
        />
      )}

      {screen !== "home" && screen !== "onboarding" && (
        <AppShell screen={screen} go={go} activeChild={activeChild}>
          {screen === "dashboard" && (
            <Dashboard
              profile={profile}
              go={go}
              guardianName={guardianName}
              dashboardData={dashboardData}
              isAuthenticated={isAuthenticated}
              isLoading={isDashboardLoading}
              activeChild={activeChild}
            />
          )}
          {screen === "roadmap" && (
            <Roadmap
              items={roadmapItems}
              latestInsight={dashboardData?.latestInsight ?? null}
              roadmapMeta={roadmapMeta}
              profile={profile}
              activeChild={activeChild}
              onItemUpdate={handleRoadmapUpdate}
              isAuthenticated={isAuthenticated}
              isLoading={isRoadmapLoading}
            />
          )}
          {screen === "progress" && (
            <Progress
              entries={timelineEntries}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              addEntry={handleProgressCreate}
              updateEntry={handleProgressUpdate}
              deleteEntry={handleProgressDelete}
              profile={profile}
              activeChild={activeChild}
              isLoading={isTimelineLoading}
            />
          )}
          {screen === "education" && (
            <Education
              activeChildId={activeChildId}
              profile={profile}
              activeChild={activeChild}
            />
          )}
          {screen === "consultation" && (
            <Consultation
              profile={profile}
              go={go}
              activeChildId={activeChildId}
              activeChild={activeChild}
            />
          )}
          {screen === "settings" && (
            <Settings
              guardian={guardian}
              activeChild={activeChild}
              onDataCleared={handleDataClearedRefresh}
              go={go}
            />
          )}
          {screen === "handoff" && <AdminDashboardScreen />}
        </AppShell>
      )}
    </main>
  );
}
