"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, uploadBinary } from "./api";
import { initialProfile, screenPaths } from "./constants";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";
import type {
  Area,
  AuthState,
  ChildApiModel,
  ChildProfile,
  ChildrenResponse,
  DashboardData,
  GuardianProfile,
  MediaAssetApiModel,
  MediaUploadResponse,
  MeResponse,
  OnboardingPayload,
  ProgressEntry,
  ProgressEntryApiModel,
  ProgressListResponse,
  RoadmapItemApiModel,
  RoadmapResponse,
  Screen,
} from "./types";
import { mapChildToProfile, mapProgressEntryToUi } from "./utils";

export function useTumbuhSession(initialScreen: Screen) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [profile, setProfile] = useState<ChildProfile>(initialProfile);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<ProgressEntry[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | "Semua">("Semua");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [guardian, setGuardian] = useState<GuardianProfile | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeChild, setActiveChild] = useState<ChildApiModel | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItemApiModel[]>([]);
  const [roadmapMeta, setRoadmapMeta] = useState<RoadmapResponse["meta"] | null>(
    null,
  );
  const [authState, setAuthState] = useState<AuthState>("loading");
  const isAuthenticatedRef = useRef(false);

  useEffect(() => {
    isAuthenticatedRef.current = authState === "ready" && Boolean(guardian);
  }, [authState, guardian]);

  const go = useCallback(
    (target: Screen, options?: { replace?: boolean }) => {
      setScreen((current) => (current === target ? current : target));
      setMobileOpen(false);
      if (options?.replace) {
        router.replace(screenPaths[target]);
        return;
      }
      router.push(screenPaths[target]);
    },
    [router],
  );

  const resetAllData = useCallback(() => {
    setMe(null);
    setGuardian(null);
    setActiveChildId(null);
    setActiveChild(null);
    setEntries([]);
    setTimelineEntries([]);
    setDashboardData(null);
    setRoadmapItems([]);
    setRoadmapMeta(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setAuthState("loading");
      const data = await apiRequest<MeResponse>("/api/me");
      setMe(data);
      setGuardian(data.guardian);
      setAuthState("ready");
      return data;
    } catch (error) {
      const status = (error as { status?: number }).status;

      if (status === 401) {
        resetAllData();
        setAuthState("unauthenticated");
        return null;
      }

      console.error("Failed to load session context", error);
      resetAllData();
      setAuthState("error");
      return null;
    }
  }, [resetAllData]);

  const loadProgressEntries = useCallback(
    async (childId: string, area?: Area | "Semua") => {
      const searchParams = new URLSearchParams();

      if (area && area !== "Semua") {
        searchParams.set("area", area);
      }

      const data = await apiRequest<ProgressListResponse>(
        `/api/children/${childId}/progress${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
      );

      return data.entries.map(mapProgressEntryToUi);
    },
    [],
  );

  const refreshProgressData = useCallback(
    async (nextChildId?: string | null) => {
      const childId = nextChildId ?? activeChildId;

      if (!childId) {
        setEntries([]);
        setTimelineEntries([]);
        return;
      }

      try {
        const [allEntries, filteredEntries] = await Promise.all([
          loadProgressEntries(childId),
          loadProgressEntries(childId, selectedArea),
        ]);

        setEntries(allEntries);
        setTimelineEntries(filteredEntries);
      } catch (error) {
        console.error("Failed to load progress entries", error);
        setEntries([]);
        setTimelineEntries([]);
      }
    },
    [activeChildId, loadProgressEntries, selectedArea],
  );

  const refreshAggregateData = useCallback(
    async (nextChildId?: string | null) => {
      const childId = nextChildId ?? activeChildId;

      if (!childId) {
        setDashboardData(null);
        setRoadmapItems([]);
        setRoadmapMeta(null);
        return;
      }

      try {
        const [dashboard, roadmap] = await Promise.all([
          apiRequest<DashboardData>(`/api/children/${childId}/dashboard`),
          apiRequest<RoadmapResponse>(`/api/children/${childId}/roadmap`),
        ]);

        setDashboardData(dashboard);
        setRoadmapItems(roadmap.items);
        setRoadmapMeta(roadmap.meta);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setDashboardData(null);
        setRoadmapItems([]);
        setRoadmapMeta(null);
      }
    },
    [activeChildId],
  );

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialSession() {
      const data = await refreshSession();
      if (cancelled || !data) {
        return;
      }
    }

    void loadInitialSession();

    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => {
    if (authState !== "ready" || !me?.onboarding.hasChildren) {
      if (me && !me.onboarding.hasChildren) {
        setActiveChildId(null);
        setActiveChild(null);
        setEntries([]);
        setTimelineEntries([]);
      }
      return;
    }

    let cancelled = false;

    async function loadChildren() {
      try {
        const data = await apiRequest<ChildrenResponse>("/api/children");

        if (cancelled) {
          return;
        }

        const firstChild = data.children[0];

        if (!firstChild) {
          setActiveChildId(null);
          setActiveChild(null);
          setEntries([]);
          setTimelineEntries([]);
          setDashboardData(null);
          setRoadmapItems([]);
          return;
        }

        setActiveChildId(firstChild.id);
        setActiveChild(firstChild);
        setProfile(mapChildToProfile(firstChild));
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load children", error);
        }
      }
    }

    void loadChildren();

    return () => {
      cancelled = true;
    };
  }, [authState, me, me?.onboarding.hasChildren]);

  useEffect(() => {
    if (authState !== "ready" || !activeChildId) {
      if (!activeChildId) {
        setEntries([]);
        setTimelineEntries([]);
      }
      return;
    }

    void refreshProgressData(activeChildId);
  }, [authState, activeChildId, selectedArea, refreshProgressData]);

  useEffect(() => {
    if (authState !== "ready" || !activeChildId) {
      if (!activeChildId) {
        setDashboardData(null);
        setRoadmapItems([]);
      }
      return;
    }

    void refreshAggregateData(activeChildId);
  }, [authState, activeChildId, refreshAggregateData]);

  useEffect(() => {
    if (authState !== "ready" || !me) {
      return;
    }

    const shouldOpenDashboard =
      me.onboarding.hasChildren && me.onboarding.hasCompletedOnboarding;

    if (screen === "onboarding" && shouldOpenDashboard) {
      go("dashboard", { replace: true });
      return;
    }

    if (
      screen !== "home" &&
      screen !== "onboarding" &&
      screen !== "settings" &&
      !shouldOpenDashboard
    ) {
      go("onboarding", { replace: true });
    }
  }, [authState, me, screen, go]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        resetAllData();
        void refreshSession();
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void refreshSession();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [refreshSession, resetAllData]);

  const handleOnboardingComplete = useCallback(
    async (payload: OnboardingPayload) => {
      if (!isAuthenticatedRef.current) {
        // Simpan draft dan arahkan ke login. Setelah login draft diresume otomatis.
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "tumbuh.onboarding.pending",
            JSON.stringify(payload),
          );
        }
        router.push("/login?next=/dashboard");
        return;
      }

      const requestInit: RequestInit = {
        method: activeChildId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      const childResponse = activeChildId
        ? await apiRequest<{ child: ChildApiModel }>(
            `/api/children/${activeChildId}`,
            requestInit,
          )
        : await apiRequest<{ child: ChildApiModel }>(
            "/api/children",
            requestInit,
          );

      const completedResponse = await apiRequest<{ child: ChildApiModel }>(
        `/api/children/${childResponse.child.id}/onboarding/complete`,
        {
          method: "POST",
        },
      );

      setActiveChild(completedResponse.child);
      setProfile(mapChildToProfile(completedResponse.child));
      setActiveChildId(completedResponse.child.id);
      await refreshSession();
      await refreshAggregateData(completedResponse.child.id);
      go("dashboard", { replace: true });
    },
    [activeChildId, go, refreshAggregateData, refreshSession, router],
  );

  useEffect(() => {
    if (authState !== "ready" || !guardian) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const pending = window.localStorage.getItem("tumbuh.onboarding.pending");
    if (!pending) return;

    try {
      const payload = JSON.parse(pending) as OnboardingPayload;
      window.localStorage.removeItem("tumbuh.onboarding.pending");
      void handleOnboardingComplete(payload).catch((error) => {
        console.error("Failed to resume onboarding", error);
      });
    } catch {
      window.localStorage.removeItem("tumbuh.onboarding.pending");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, guardian]);

  const handleRoadmapUpdate = useCallback(
    async (
      itemId: string,
      payload: {
        status?: RoadmapItemApiModel["status"];
        detail?: string | null;
      },
    ) => {
      if (!activeChildId) return;

      const response = await apiRequest<{ item: RoadmapItemApiModel }>(
        `/api/children/${activeChildId}/roadmap/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      // Optimistic local update dulu agar UI cepat responsif.
      setRoadmapItems((current) =>
        current.map((item) => (item.id === itemId ? response.item : item)),
      );

      // Refresh agregat supaya KPI "Target tercapai" ikut update.
      await refreshAggregateData(activeChildId);
    },
    [activeChildId, refreshAggregateData],
  );

  const handleProgressCreate = useCallback(
    async (payload: {
      area: Area;
      inputType: ProgressEntry["type"];
      note: string;
      title?: string;
      file?: File | null;
    }) => {
      if (!activeChildId) {
        return;
      }

      let mediaId: string | undefined;

      if (payload.inputType !== "Teks") {
        if (!payload.file) {
          throw new Error("File is required for media entries");
        }

        await apiRequest<{ consent: { id: string } }>(
          `/api/children/${activeChildId}/consents`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              scope: "media_upload",
              granted: true,
              source: "progress_form",
            }),
          },
        );

        const uploadRequest = await apiRequest<MediaUploadResponse>(
          "/api/media/upload-url",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              childId: activeChildId,
              type: payload.inputType,
              fileName: payload.file.name,
              mimeType: payload.file.type || "application/octet-stream",
              sizeBytes: payload.file.size,
            }),
          },
        );

        await uploadBinary(
          uploadRequest.upload.uploadUrl,
          payload.file,
          uploadRequest.upload.uploadMethod,
          uploadRequest.upload.uploadHeaders,
        );

        mediaId = uploadRequest.asset.id;
      }

      await apiRequest<{ entry: ProgressEntryApiModel }>(
        `/api/children/${activeChildId}/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            area: payload.area,
            inputType: payload.inputType,
            note: payload.note,
            title: payload.title ?? null,
            mediaId,
            observedAt: new Date().toISOString(),
          }),
        },
      );

      if (mediaId) {
        await apiRequest<{ asset: MediaAssetApiModel }>(
          `/api/media/${mediaId}/process`,
          {
            method: "POST",
          },
        );
      }

      await refreshProgressData(activeChildId);
      await refreshAggregateData(activeChildId);
    },
    [activeChildId, refreshAggregateData, refreshProgressData],
  );

  const handleProgressUpdate = useCallback(
    async (
      entryId: string,
      payload: {
        area: Area;
        note: string;
        title?: string | null;
      },
    ) => {
      await apiRequest<{ entry: ProgressEntryApiModel }>(
        `/api/progress/${entryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            area: payload.area,
            note: payload.note,
            title: payload.title ?? null,
          }),
        },
      );

      await refreshProgressData(activeChildId);
      await refreshAggregateData(activeChildId);
    },
    [activeChildId, refreshAggregateData, refreshProgressData],
  );

  const handleProgressDelete = useCallback(
    async (entryId: string) => {
      await apiRequest<{ entry: ProgressEntryApiModel }>(
        `/api/progress/${entryId}`,
        {
          method: "DELETE",
        },
      );

      await refreshProgressData(activeChildId);
      await refreshAggregateData(activeChildId);
    },
    [activeChildId, refreshAggregateData, refreshProgressData],
  );

  const handleDataClearedRefresh = useCallback(async () => {
    setActiveChildId(null);
    setActiveChild(null);
    setProfile(initialProfile);
    setEntries([]);
    setTimelineEntries([]);
    setDashboardData(null);
    setRoadmapItems([]);
    setRoadmapMeta(null);
    await refreshSession();
  }, [refreshSession]);

  const guardianName = guardian?.displayName?.trim() || "Orang Tua";
  const isAuthenticated = authState === "ready" && Boolean(guardian);
  const isBooting = authState === "loading";
  const isChildrenPending =
    authState === "ready" && Boolean(me?.onboarding.hasChildren) && !activeChildId;
  const hasActiveChild =
    authState === "ready" && Boolean(guardian) && Boolean(activeChildId);
  const isDashboardLoading =
    isBooting || isChildrenPending || (hasActiveChild && dashboardData === null);
  const isRoadmapLoading =
    isBooting || isChildrenPending || (hasActiveChild && roadmapMeta === null);
  const isTimelineLoading =
    isBooting || isChildrenPending || (hasActiveChild && timelineEntries.length === 0 && entries.length === 0 && dashboardData === null);
  const primaryStartHref = useMemo(() => {
    return authState === "ready" &&
      me?.onboarding.hasChildren &&
      me.onboarding.hasCompletedOnboarding
      ? screenPaths.dashboard
      : screenPaths.onboarding;
  }, [authState, me]);

  return {
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
    authState,
    go,
    handleOnboardingComplete,
    handleProgressCreate,
    handleProgressUpdate,
    handleProgressDelete,
    handleRoadmapUpdate,
    handleDataClearedRefresh,
  };
}
