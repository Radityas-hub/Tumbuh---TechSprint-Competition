"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FileText,
  HeartHandshake,
  Home,
  Image as ImageIcon,
  LineChart,
  MapPin,
  Menu,
  Mic,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TimerReset,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

type Area = "Komunikasi" | "Motorik" | "Perilaku" | "Akademik";
type Screen =
  | "home"
  | "onboarding"
  | "dashboard"
  | "roadmap"
  | "progress"
  | "education"
  | "consultation"
  | "handoff";

type ChildProfile = {
  name: string;
  birthDate: string;
  condition: string;
  focusAreas: Area[];
};

type GuardianProfile = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

type MeResponse = {
  guardian: GuardianProfile;
  onboarding: {
    childCount: number;
    completedChildCount: number;
    hasChildren: boolean;
    hasCompletedOnboarding: boolean;
  };
};

type ChildApiModel = {
  id: string;
  guardianId: string;
  name: string;
  birthDate: string;
  condition: string;
  focusAreas: Area[];
  routine: string | null;
  supportNeed: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChildrenResponse = {
  children: ChildApiModel[];
};

type OnboardingPayload = ChildProfile & {
  routine: string;
  supportNeed: string;
};

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ProgressEntryApiModel = {
  id: string;
  childId: string;
  area: Area;
  inputType: "Teks" | "Foto" | "Suara";
  title: string | null;
  note: string | null;
  insight: string | null;
  observedAt: string;
  createdAt: string;
  updatedAt: string;
};

type ProgressListResponse = {
  entries: ProgressEntryApiModel[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

type ProgressEntry = {
  id: string;
  type: "Teks" | "Foto" | "Suara";
  title: string;
  note: string;
  area: Area;
  date: string;
  insight: string;
};

const initialProfile: ChildProfile = {
  name: "Dafa",
  birthDate: "2020-08-12",
  condition: "Autisme - sudah diagnosis",
  focusAreas: ["Komunikasi", "Perilaku"],
};

const navItems: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { id: "roadmap", label: "Roadmap", icon: <Target size={18} /> },
  { id: "progress", label: "Catatan", icon: <ClipboardList size={18} /> },
  { id: "education", label: "Edukasi", icon: <BookOpen size={18} /> },
  { id: "consultation", label: "Konsultasi", icon: <Stethoscope size={18} /> },
  { id: "handoff", label: "Backend", icon: <FileText size={18} /> },
];

const roadmap = [
  {
    title: "Kontak mata 5 detik",
    status: "Tercapai",
    detail:
      "Tercatat konsisten pada 6 catatan terakhir ketika instruksi pendek.",
    tone: "green",
  },
  {
    title: "Meminta bantuan",
    status: "Berproses",
    detail:
      "Muncul 4 kali minggu ini, masih membutuhkan prompt visual.",
    tone: "amber",
  },
  {
    title: "Kalimat dua kata",
    status: "Target berikutnya",
    detail:
      "Latihan dengan benda konkret: mau minum, mau main, mau roti.",
    tone: "blue",
  },
  {
    title: "Transisi tanpa tantrum",
    status: "Perlu perhatian",
    detail:
      "Pemicu dominan: berhenti screen time secara mendadak sebelum mandi.",
    tone: "coral",
  },
];

const activities = [
  {
    icon: <TimerReset size={20} />,
    title: "Timer visual sebelum transisi",
    body: "Pasang timer 5 menit sebelum berhenti screen time, lalu beri pilihan aktivitas berikutnya.",
    area: "Perilaku",
  },
  {
    icon: <Activity size={20} />,
    title: "Latihan meminta bantuan",
    body: "Siapkan dua kartu visual: minum dan main. Tunggu 5 detik sebelum memberi prompt.",
    area: "Komunikasi",
  },
  {
    icon: <Utensils size={20} />,
    title: "Snack tinggi omega-3",
    body: "Gunakan menu sederhana seperti telur, ikan, atau chia pudding bila sesuai dengan arahan dokter.",
    area: "Rutinitas",
  },
];

const articles = [
  {
    title: "Cara membaca milestone tanpa panik",
    category: "Panduan orang tua",
    readTime: "6 menit",
    body: "Milestone adalah arah observasi, bukan label untuk menghakimi kemampuan anak.",
  },
  {
    title: "Menyiapkan catatan sebelum konsultasi terapi",
    category: "Konsultasi",
    readTime: "5 menit",
    body: "Catatan yang baik berisi konteks, frekuensi, pemicu, dan perubahan setelah intervensi.",
  },
  {
    title: "Rutinitas visual untuk anak autisme",
    category: "Aktivitas rumah",
    readTime: "7 menit",
    body: "Rutinitas visual membantu anak memahami transisi dan mengurangi kejutan mendadak.",
  },
];

const backendContracts = [
  {
    endpoint: "POST /api/children",
    purpose: "Menyimpan profil anak setelah onboarding.",
    fields: "name, birthDate, condition, focusAreas, guardianId",
  },
  {
    endpoint: "POST /api/progress",
    purpose: "Menyimpan catatan teks, foto, atau suara dari orang tua.",
    fields: "childId, inputType, note, mediaUrl, area, createdAt",
  },
  {
    endpoint: "GET /api/children/:id/insights",
    purpose: "Mengambil ringkasan mingguan, alert, dan rekomendasi aktivitas.",
    fields: "summary, alerts, recommendedActivities, roadmap",
  },
  {
    endpoint: "POST /api/documents/analyze",
    purpose: "Mengunggah laporan terapi/dokter untuk diekstrak menjadi poin penting.",
    fields: "childId, fileUrl, documentType, extractedTargets",
  },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const screenPaths: Record<Screen, string> = {
  home: "/",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  roadmap: "/roadmap",
  progress: "/progress",
  education: "/education",
  consultation: "/consultation",
  handoff: "/backend",
};

const homeNavItems = [
  { label: "Home", href: "#home" },
  { label: "How it works", href: "#workflow" },
  { label: "Features", href: "#features" },
];

function getDevelopmentAuthHeaders() {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  const authUserId =
    process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID?.trim() || "dev-user-1";
  const email =
    process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL?.trim() || "dev@example.com";
  const displayName =
    process.env.NEXT_PUBLIC_DEV_AUTH_NAME?.trim() || "Ibu Rani";

  return {
    "x-dev-auth-user-id": authUserId,
    "x-dev-auth-email": email,
    "x-dev-auth-name": displayName,
  };
}

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  Object.entries(getDevelopmentAuthHeaders()).forEach(([key, value]) => {
    if (!headers.has(key) && value) {
      headers.set(key, value);
    }
  });

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json()) as { data?: T } & ApiErrorResponse;

  if (!response.ok) {
    const message = payload.error?.message || "Request failed";
    const error = new Error(message) as Error & {
      code?: string;
      status?: number;
      details?: unknown;
    };
    error.code = payload.error?.code;
    error.status = response.status;
    error.details = payload.error?.details;
    throw error;
  }

  return payload.data as T;
}

function mapChildToProfile(child: ChildApiModel): ChildProfile {
  return {
    name: child.name,
    birthDate: child.birthDate.slice(0, 10),
    condition: child.condition,
    focusAreas: child.focusAreas,
  };
}

function getChildRoutine(child: ChildApiModel | null) {
  return child?.routine || "Rutinitas visual pagi dan transisi sore";
}

function getChildSupportNeed(child: ChildApiModel | null) {
  return child?.supportNeed || "Arahan aktivitas harian yang praktis";
}

function formatObservedDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

function mapProgressEntryToUi(entry: ProgressEntryApiModel): ProgressEntry {
  return {
    id: entry.id,
    type: entry.inputType,
    area: entry.area,
    title:
      entry.title ||
      (entry.inputType === "Teks"
        ? "Catatan perkembangan baru"
        : entry.inputType === "Foto"
          ? "Observasi dari aktivitas visual"
          : "Ringkasan voice note orang tua"),
    note: entry.note || "",
    date: formatObservedDate(entry.observedAt),
    insight:
      entry.insight ||
      "Catatan baru siap dikirim ke backend untuk ekstraksi pola, ringkasan, dan pembaruan roadmap.",
  };
}

export default function TumbuhApp({
  initialScreen = "home",
}: {
  initialScreen?: Screen;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement | null>(null);
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
  const [authState, setAuthState] = useState<"loading" | "ready" | "unauthenticated" | "error">("loading");

  const go = (target: Screen, options?: { replace?: boolean }) => {
    if (screen !== target) {
      setScreen(target);
    }
    setMobileOpen(false);
    if (options?.replace) {
      router.replace(screenPaths[target]);
      return;
    }
    router.push(screenPaths[target]);
  };

  async function refreshSession() {
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
        setMe(null);
        setGuardian(null);
        setActiveChildId(null);
        setActiveChild(null);
        setEntries([]);
        setTimelineEntries([]);
        setAuthState("unauthenticated");
        return null;
      }

      console.error("Failed to load session context", error);
      setMe(null);
      setGuardian(null);
      setActiveChildId(null);
      setActiveChild(null);
      setEntries([]);
      setTimelineEntries([]);
      setAuthState("error");
      return null;
    }
  }

  async function loadProgressEntries(childId: string, area?: Area | "Semua") {
    const searchParams = new URLSearchParams();

    if (area && area !== "Semua") {
      searchParams.set("area", area);
    }

    const data = await apiRequest<ProgressListResponse>(
      `/api/children/${childId}/progress${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    );

    return data.entries.map(mapProgressEntryToUi);
  }

  async function refreshProgressData(nextChildId?: string | null) {
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
  }

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
  }, []);

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
  }, [authState, me?.onboarding.hasChildren]);

  useEffect(() => {
    if (authState !== "ready" || !activeChildId) {
      if (!activeChildId) {
        setEntries([]);
        setTimelineEntries([]);
      }
      return;
    }

    void refreshProgressData(activeChildId);
  }, [authState, activeChildId, selectedArea]);

  async function handleOnboardingComplete(payload: OnboardingPayload) {
    const requestInit: RequestInit = {
      method: activeChildId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    const childResponse = activeChildId
      ? await apiRequest<{ child: ChildApiModel }>(`/api/children/${activeChildId}`, requestInit)
      : await apiRequest<{ child: ChildApiModel }>("/api/children", requestInit);

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
    go("dashboard", { replace: true });
  }

  async function handleProgressCreate(payload: {
    area: Area;
    inputType: ProgressEntry["type"];
    note: string;
    title?: string;
  }) {
    if (!activeChildId) {
      return;
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
          observedAt: new Date().toISOString(),
        }),
      },
    );

    await refreshProgressData(activeChildId);
  }

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
      !shouldOpenDashboard
    ) {
      go("onboarding", { replace: true });
    }
  }, [authState, me, screen]);

  const guardianName = guardian?.displayName?.trim() || "Ibu Rani";
  const primaryStartHref =
    authState === "ready" &&
    me?.onboarding.hasChildren &&
    me.onboarding.hasCompletedOnboarding
      ? screenPaths.dashboard
      : screenPaths.onboarding;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          animate: "(prefers-reduced-motion: no-preference)",
        },
        (media) => {
          const revealElements = [
            ".home-title-group h1",
            ".care-team span",
            ".home-intro-card p",
            ".home-intro-card .primary-button",
            ".hero-caption-card",
            ".hero-proof div",
            ".home-section h2",
            ".home-section .section-heading p",
            ".narrative-text p",
            ".side-by-side-workflow .overline",
            ".workflow-subtitle",
            ".split-subtitle",
            ".ethics-banner h2",
            ".ethics-banner p",
            ".ethics-icon",
            ".home-final-cta h2",
            ".home-final-cta p",
            ".home-final-cta a",
            ".workspace-header h1",
            ".workspace-header p",
            ".workspace-header button",
            ".onboarding-heading h1",
            ".onboarding-heading p",
            ".onboarding-fields label",
            ".soft-info",
            ".onboarding-note",
            ".review-step label",
            ".review-card > div",
            ".consent-note",
          ].join(", ");

          const revealGroups = [
            ".workflow-list",
            ".image-cards-grid",
            ".value-list",
            ".metric-grid",
            ".dashboard-grid",
            ".roadmap-layout",
            ".progress-layout",
            ".education-layout",
            ".consult-grid",
            ".handoff-grid",
            ".diagnosis-list",
            ".focus-option-grid",
          ].join(", ");

          if (media.conditions?.reduceMotion) {
            gsap.set(`${revealElements}, ${revealGroups} > *`, {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              clearProps: "all",
            });
            return;
          }

          gsap.utils.toArray<HTMLElement>(revealElements).forEach((element) => {
            gsap.fromTo(
              element,
              { autoAlpha: 0, y: 20 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 84%",
                  once: true,
                },
              },
            );
          });

          gsap.utils.toArray<HTMLElement>(revealGroups).forEach((group) => {
            const children = Array.from(group.children);
            gsap.fromTo(
              children,
              { autoAlpha: 0, y: 22 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                stagger: 0.08,
                scrollTrigger: {
                  trigger: group,
                  start: "top 82%",
                  once: true,
                },
              },
            );
          });

          gsap.fromTo(
            ".home-hero-image",
            { scale: 1.04 },
            {
              scale: 1,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".home-photo-wrap",
                start: "top 90%",
                once: true,
              },
            },
          );

          gsap.fromTo(
            ".collage-img-wrap.main-img",
            { autoAlpha: 0, x: 40, scale: 0.95 },
            {
              autoAlpha: 1,
              x: 0,
              scale: 1,
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".workflow-image-collage",
                start: "top 80%",
                once: true,
              },
            }
          );

          gsap.fromTo(
            ".collage-img-wrap.secondary-img",
            { autoAlpha: 0, x: -30, y: 30, scale: 0.95 },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: 1,
              ease: "power2.out",
              delay: 0.2,
              scrollTrigger: {
                trigger: ".workflow-image-collage",
                start: "top 80%",
                once: true,
              },
            }
          );

          gsap.fromTo(
            ".split-image-container img",
            { scale: 1.1 },
            {
              scale: 1,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".split-image-container",
                start: "top 85%",
                once: true,
              },
            }
          );
        },
      );
    }, root);

    return () => context.revert();
  }, [screen]);

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
        <AppShell screen={screen} go={go}>
          {screen === "dashboard" && (
            <Dashboard
              profile={profile}
              entries={entries}
              go={go}
              guardianName={guardianName}
            />
          )}
          {screen === "roadmap" && <Roadmap />}
          {screen === "progress" && (
            <Progress
              entries={timelineEntries}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              addEntry={handleProgressCreate}
            />
          )}
          {screen === "education" && <Education />}
          {screen === "consultation" && (
            <Consultation profile={profile} go={go} />
          )}
          {screen === "handoff" && <BackendHandoff />}
        </AppShell>
      )}
    </main>
  );
}

function Header({
  mobileOpen,
  setMobileOpen,
  startHref,
}: {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  startHref: string;
}) {
  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="site-header">
      <Link className="brand" href="#home" onClick={closeMenu} aria-label="Ke halaman awal">
        <span>Tumbuh</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigasi utama">
        {homeNavItems.map((item) => (
          <Link key={item.href} className="nav-link" href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="ghost-button desktop-only" href={startHref}>
        Get Started
      </Link>
      <button
        className="menu-button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Buka menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {mobileOpen && (
        <div className="mobile-panel">
          {homeNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}
          <Link className="mobile-start-link" href={startHref} onClick={closeMenu}>
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}

function Landing({
  go,
  startHref,
}: {
  go: (screen: Screen) => void;
  startHref: string;
}) {
  return (
    <section className="landing" id="home">
      <div className="home-hero-top">
        <div className="home-title-group">
          <h1>
            Pahami dari langkah kecil.
          </h1>
          <div className="care-team">
            <span>Orang tua</span>
            <span>Terapis</span>
            <span>Sekolah</span>
          </div>
        </div>
        <div className="home-intro-card">
          <p>
            Tumbuh adalah ruang aman bagi Anda. Catat momen kecilnya setiap hari tanpa beban, dan biarkan kami merangkainya jadi panduan yang lebih jelas.
          </p>
          <Link className="primary-button" href={startHref}>
            Mulai buat roadmap
          </Link>
        </div>
      </div>
      <div className="home-photo-wrap">
        <Image
          src="/images/hero_bonding_moment.png"
          alt="Ibu dan anak berinteraksi hangat di rumah yang tenang"
          className="home-hero-image"
          width={1280}
          height={853}
          priority
        />
        <div className="hero-caption-card">
          <HeartHandshake size={22} />
          <div>
            <strong>Catatan dari rutinitas nyata</strong>
            <p>
              Perkembangan terbesar justru sering berawal di rumah, dari hal-hal kecil yang hanya disadari oleh orang tua.
            </p>
          </div>
        </div>
      </div>

      <section className="home-section narrative-problem" id="problem">
        <p className="overline">Tantangan Sehari-hari</p>
        <h2>Anda tidak harus mencari arah sendirian.</h2>
        <div className="narrative-text">
          <p>
            Pernah merasa bingung harus melakukan apa setelah pulang dari sesi konsultasi terapi? Banyak momen kemajuan terjadi di rumah, namun sulit diingat detailnya saat bertemu dokter. Buku penghubung sekolah, resep dokter, dan observasi harian sering tercecer, membuat Anda makin kewalahan.
          </p>
        </div>
      </section>

      <section className="home-section side-by-side-workflow" id="workflow">
        <div className="workflow-text-content">
          <p className="overline">Cara Kerja</p>
          <h2>Dari cerita ke langkah nyata</h2>
          <p className="workflow-subtitle">Tumbuh dirancang untuk hari-hari yang tidak selalu rapi. Mulai dari satu catatan kecil, lalu biarkan sistem membantu merangkai maknanya perlahan.</p>
          
          <div className="workflow-list">
            {[
              ["01", "Mulai dengan perkenalan", "Isi rentang usia, kondisi, dan area yang paling ingin Anda pahami saat ini."],
              ["02", "Ceritakan hari ini", "Bisa lewat teks singkat, rekaman suara saat lelah mengetik, atau foto aktivitas."],
              ["03", "Temukan pola perkembangannya", "Sistem merangkum cerita Anda, menunjukkan pola, dan memberi ide aktivitas sederhana."],
              ["04", "Lebih siap saat konsultasi", "Anda punya ringkasan yang lebih tertata untuk didiskusikan dengan profesional."],
            ].map(([number, title, body]) => (
              <div key={title} className="workflow-list-item">
                <span className="workflow-number">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="workflow-image-collage">
          <div className="collage-img-wrap main-img">
            <Image src="/images/parent_writing.png" fill style={{ objectFit: 'cover' }} alt="Orang tua mencatat dengan tenang" />
          </div>
          <div className="collage-img-wrap secondary-img">
            <Image src="/images/child_playing.png" fill style={{ objectFit: 'cover' }} alt="Anak sedang bermain" />
          </div>
        </div>
      </section>

      <section className="home-section image-cards-section" id="features">
        <div className="section-heading centered-heading">
          <h2>Fokus pada hal yang terpenting</h2>
          <p>Tumbuh hadir agar Anda bisa bernapas sedikit lebih lega tanpa melupakan progres anak.</p>
        </div>
        <div className="image-cards-grid">
          <div className="image-card">
            <Image src="/images/abstract_growth.png" fill style={{ objectFit: 'cover' }} alt="Mencatat" />
            <div className="card-glass-content">
              <h3>Mencatat tanpa tuntutan sempurna</h3>
              <p>Tulis sesingkat mungkin, rekam keluhan, atau kirim foto tanpa ada format rumit yang harus diisi.</p>
            </div>
          </div>
          <div className="image-card">
            <Image src="/images/doctor_consulting.png" fill style={{ objectFit: 'cover' }} alt="Konsultasi" />
            <div className="card-glass-content">
              <h3>Lebih tenang saat bertemu terapis</h3>
              <p>Bawa ringkasan bulanan yang rapi untuk bahan diskusi yang jauh lebih produktif.</p>
            </div>
          </div>
          <div className="image-card">
            <Image src="/images/parent_child_hands.png" fill style={{ objectFit: 'cover' }} alt="Arah esok hari" />
            <div className="card-glass-content">
              <h3>Menemukan arah untuk esok hari</h3>
              <p>Roadmap disusun dengan kecepatan yang sesuai kondisi anak, tanpa perlu membandingkan.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section split-value-section" id="demo">
        <div className="split-image-container">
          <Image src="/images/parent_child_hands.png" fill style={{ objectFit: 'cover' }} alt="Parent and child hands" />
        </div>
        <div className="split-content">
          <h2>Langkah praktis yang mudah dicoba</h2>
          <p className="split-subtitle">Anda tidak perlu menjadi ahli. Tumbuh menerjemahkan observasi keseharian menjadi pilihan tindakan yang lebih tenang dan praktis.</p>
          
          <div className="value-list">
            {[
              ["Ruang catatan manusiawi", "Boleh berantakan, boleh singkat. Yang terpenting, kejadian penting tidak terlewat."],
              ["Roadmap yang menemani", "Target perkembangan beradaptasi dengan ritme anak Anda yang unik."],
              ["Pengingat non-judgemental", "Dibuat sebagai ajakan lembut untuk melihat pola, bukan alarm yang membuat panik."],
            ].map(([title, body]) => (
              <div key={title} className="value-list-item">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <Link className="secondary-button" href="/dashboard" style={{ marginTop: '32px' }}>
            Jelajahi dashboard demo
          </Link>
        </div>
      </section>

      <section className="home-section ethics-banner" id="safety">
        <div className="ethics-content">
          <ShieldCheck size={48} className="ethics-icon" />
          <h2>Mendampingi, bukan mendiagnosis.</h2>
          <p>
            Tumbuh hadir sebagai pendamping, bukan pengganti profesional medis. Semua insight hadir sebagai referensi diskusi Anda bersama profesional. Kendali penuh atas data sensitif, foto, dan dokumen anak tetap berada di tangan Anda dengan enkripsi.
          </p>
        </div>
      </section>

      <section className="home-section home-final-cta">
        <h2>Mulai kapan pun Anda siap.</h2>
        <p>
          Mulailah dari satu kejadian kecil yang Anda ingat hari ini. Dari sana, kita akan menyusun langkah berikutnya bersama-sama.
        </p>
        <div>
          <Link className="primary-button" href={startHref}>
            Mulai kenalkan anak Anda
            <ArrowRight size={18} />
          </Link>
          <Link className="secondary-button" href="/backend">
            Spesifikasi Backend
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <strong>Tumbuh</strong>
        <span>Tempat orang tua menyusun cerita, melihat pola, dan menemukan harapan di setiap langkah kecil.</span>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/progress">Catatan</Link>
          <Link href="/consultation">Konsultasi</Link>
        </nav>
      </footer>
    </section>
  );
}

function AppShell({
  screen,
  go,
  children,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
  children: ReactNode;
}) {
  return (
    <div className="product-shell">
      <aside className="sidebar">
        <button className="brand sidebar-brand" onClick={() => go("home")}>
          <span>Tumbuh</span>
        </button>
        <div className="sidebar-section">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cx("sidebar-link", screen === item.id && "active")}
              onClick={() => go(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="privacy-note">
          <ShieldCheck size={20} />
          <p>
            Data anak bersifat sensitif. Backend perlu consent, enkripsi, dan
            kontrol hapus data.
          </p>
        </div>
      </aside>
      <section className="workspace">{children}</section>
    </div>
  );
}

function Onboarding({
  profile,
  setProfile,
  go,
  onComplete,
  initialRoutine,
  initialSupportNeed,
}: {
  profile: ChildProfile;
  setProfile: (profile: ChildProfile) => void;
  go: (screen: Screen) => void;
  onComplete: (payload: OnboardingPayload) => Promise<void>;
  initialRoutine: string;
  initialSupportNeed: string;
}) {
  const [draft, setDraft] = useState(profile);
  const [step, setStep] = useState(1);
  const [routine, setRoutine] = useState(initialRoutine);
  const [supportNeed, setSupportNeed] = useState(initialSupportNeed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 4;

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    setRoutine(initialRoutine);
  }, [initialRoutine]);

  useEffect(() => {
    setSupportNeed(initialSupportNeed);
  }, [initialSupportNeed]);

  const conditions = [
    "Autisme - sudah diagnosis",
    "ADHD - sudah diagnosis",
    "Down Syndrome",
    "Disleksia",
    "Gangguan Bicara",
    "Belum ada diagnosis resmi",
  ];

  const focusOptions: Array<{
    area: Area;
    title: string;
    body: string;
    icon: ReactNode;
  }> = [
    {
      area: "Komunikasi",
      title: "Komunikasi",
      body: "Perkembangan bahasa, kontak mata, dan interaksi sosial.",
      icon: <ClipboardList size={28} />,
    },
    {
      area: "Motorik",
      title: "Motorik",
      body: "Koordinasi fisik, kekuatan otot, dan aktivitas sensorik.",
      icon: <Activity size={28} />,
    },
    {
      area: "Perilaku",
      title: "Perilaku",
      body: "Manajemen emosi, kebiasaan harian, dan pemicu tantrum.",
      icon: <BrainCircuit size={28} />,
    },
    {
      area: "Akademik",
      title: "Akademik",
      body: "Kemampuan belajar, fokus, dan kesiapan aktivitas sekolah.",
      icon: <BookOpen size={28} />,
    },
  ];

  const toggleArea = (area: Area) => {
    const exists = draft.focusAreas.includes(area);
    setDraft({
      ...draft,
      focusAreas: exists
        ? draft.focusAreas.filter((item) => item !== area)
        : [...draft.focusAreas, area],
    });
  };

  const goNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    setIsSubmitting(true);

    void onComplete({
      ...draft,
      routine,
      supportNeed,
    })
      .catch((error) => {
        console.error("Failed to complete onboarding", error);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const stepContent = [
    {
      title: "Siapa nama anak Anda?",
      body: "Informasi dasar ini membantu Tumbuh membuat pengalaman yang terasa personal.",
    },
    {
      title: "Apa kondisi yang sudah terdiagnosis?",
      body: "Pilih kondisi yang paling sesuai. Jika belum ada diagnosis resmi, tetap bisa lanjut.",
    },
    {
      title: "Kamu ingin fokus memantau apa?",
      body: "Pilih satu atau lebih area tumbuh kembang yang menjadi prioritas utama saat ini.",
    },
    {
      title: "Siapkan roadmap pertama",
      body: "Konfirmasi pilihan dan tentukan rutinitas awal yang ingin dicoba di rumah.",
    },
  ];

  return (
    <section className="onboarding-screen">
      <div className="onboarding-topbar">
        <button type="button" onClick={() => go("home")}>
          Tumbuh
        </button>
        <span>Langkah {step} dari {totalSteps}</span>
      </div>
      <form
        className="onboarding-stage"
        onSubmit={(event) => {
          event.preventDefault();
          goNext();
        }}
      >
        <div className="onboarding-heading">
          <h1>{stepContent[step - 1].title}</h1>
          <p>{stepContent[step - 1].body}</p>
        </div>
        {step === 1 && (
          <div className="onboarding-fields">
            <label>
              Nama anak
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                required
              />
            </label>
            <label>
              Tanggal lahir
              <input
                type="date"
                value={draft.birthDate}
                onChange={(event) =>
                  setDraft({ ...draft, birthDate: event.target.value })
                }
                required
              />
            </label>
            <div className="soft-info">
              <CalendarDays size={20} />
              <p>
                Tanggal lahir dipakai untuk menyesuaikan milestone dengan usia
                anak.
              </p>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="diagnosis-list">
            {conditions.map((condition) => (
              <button
                key={condition}
                type="button"
                className={cx(
                  "diagnosis-option",
                  draft.condition === condition && "selected",
                )}
                onClick={() => setDraft({ ...draft, condition })}
              >
                <span>{condition}</span>
                <CheckCircle2 size={22} />
              </button>
            ))}
            <button
              type="button"
              className={cx(
                "other-condition",
                draft.condition === "Kondisi lain - perlu ditinjau" && "selected",
              )}
              onClick={() =>
                setDraft({ ...draft, condition: "Kondisi lain - perlu ditinjau" })
              }
            >
              + Kondisi lain...
            </button>
          </div>
        )}
        {step === 3 && (
          <>
            <div className="focus-option-grid">
              {focusOptions.map((option) => (
                <button
                  type="button"
                  key={option.area}
                  className={cx(
                    "focus-option-card",
                    draft.focusAreas.includes(option.area) && "selected",
                  )}
                  onClick={() => toggleArea(option.area)}
                >
                  <span>{option.icon}</span>
                  <strong>{option.title}</strong>
                  <p>{option.body}</p>
                </button>
              ))}
            </div>
            <div className="onboarding-note">
              <BrainCircuit size={22} />
              <p>
                Pilihan ini bisa diubah kapan saja lewat pengaturan profil
                setelah proses pendaftaran selesai.
              </p>
            </div>
          </>
        )}
        {step === 4 && (
          <div className="onboarding-fields review-step">
            <label>
              Rutinitas awal yang ingin dicoba
              <select
                value={routine}
                onChange={(event) => setRoutine(event.target.value)}
              >
                <option>Rutinitas visual pagi dan transisi sore</option>
                <option>Latihan komunikasi 10 menit setelah makan</option>
                <option>Jadwal sensory play sebelum aktivitas fokus</option>
                <option>Catatan emosi harian sebelum tidur</option>
              </select>
            </label>
            <label>
              Bantuan yang paling dibutuhkan
              <select
                value={supportNeed}
                onChange={(event) => setSupportNeed(event.target.value)}
              >
                <option>Arahan aktivitas harian yang praktis</option>
                <option>Ringkasan progress untuk konsultasi</option>
                <option>Reminder terapi dan rutinitas</option>
                <option>Artikel edukasi yang sesuai kondisi anak</option>
              </select>
            </label>
            <div className="review-card">
              <div>
                <span>Nama anak</span>
                <strong>{draft.name}</strong>
              </div>
              <div>
                <span>Kondisi</span>
                <strong>{draft.condition}</strong>
              </div>
              <div>
                <span>Fokus</span>
                <strong>{draft.focusAreas.join(", ")}</strong>
              </div>
              <div>
                <span>Kebutuhan</span>
                <strong>{supportNeed}</strong>
              </div>
            </div>
            <div className="consent-note">
              <ShieldCheck size={20} />
              <p>
                Insight AI ditampilkan sebagai bahan diskusi dengan profesional,
                bukan diagnosis atau pengganti terapi.
              </p>
            </div>
          </div>
        )}
        <div className="onboarding-footer">
          {step > 1 && (
            <button
              className="tertiary-button"
              type="button"
              onClick={() => setStep(step - 1)}
            >
              Kembali
            </button>
          )}
          <button
            className="primary-button onboarding-next"
            type="button"
            onClick={goNext}
            disabled={isSubmitting}
          >
            {step === totalSteps ? "Buat roadmap awal" : "Lanjut"}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}

function Dashboard({
  profile,
  entries,
  go,
  guardianName,
}: {
  profile: ChildProfile;
  entries: ProgressEntry[];
  go: (screen: Screen) => void;
  guardianName: string;
}) {
  return (
    <>
      <WorkspaceHeader
        title={`Selamat pagi, ${guardianName}`}
        body={`Fokus ${profile.name} minggu ini: ${profile.focusAreas.join(
          " dan ",
        )}. Semua insight di bawah siap dihubungkan ke backend.`}
        action={
          <button className="primary-button" onClick={() => go("progress")}>
            <Plus size={18} /> Catat perkembangan
          </button>
        }
      />
      <div className="metric-grid">
        <Metric label="Catatan minggu ini" value={String(entries.length)} tone="green" />
        <Metric label="Aktivitas selesai" value="7" tone="blue" />
        <Metric label="Target tercapai" value="2" tone="amber" />
        <Metric label="Alert penting" value="1" tone="coral" />
      </div>
      <div className="dashboard-grid">
        <Panel className="wide-panel">
          <div className="panel-head">
            <div>
              <h2>Progress komunikasi</h2>
              <p>Grafik mingguan berdasarkan catatan teks, foto, dan suara.</p>
            </div>
            <span className="trend-up">+18%</span>
          </div>
          <div className="chart-modern">
            {[38, 62, 46, 74, 58, 86, 72].map((height, index) => (
              <div key={index} className="bar-column">
                <span style={{ height: `${height}%` }} />
                <small>{["S", "S", "R", "K", "J", "S", "M"][index]}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="panel-head compact">
            <h2>AI insight</h2>
            <Sparkles size={22} />
          </div>
          <p className="insight-text">
            Kontak mata lebih konsisten setelah sensory play sore. Coba jadwalkan
            aktivitas sensorik 10 menit sebelum latihan komunikasi.
          </p>
          <button className="text-button" onClick={() => go("roadmap")}>
            Lihat dampak ke roadmap <ChevronRight size={18} />
          </button>
        </Panel>
        <Panel>
          <h2>Aktivitas hari ini</h2>
          <div className="activity-list">
            {activities.map((activity) => (
              <div className="activity-row" key={activity.title}>
                <span>{activity.icon}</span>
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
              <p>Urutan milestone yang paling relevan untuk minggu ini.</p>
            </div>
            <button className="secondary-button" onClick={() => go("roadmap")}>
              Buka roadmap
            </button>
          </div>
          <RoadmapStrip />
        </Panel>
      </div>
    </>
  );
}

function Roadmap() {
  return (
    <>
      <WorkspaceHeader
        title="Roadmap adaptif"
        body="Setiap target memiliki alasan, status, dan aktivitas pendukung agar orang tua tahu harus melakukan apa setelah membaca insight."
      />
      <div className="roadmap-layout">
        <Panel className="timeline-panel">
          {roadmap.map((item, index) => (
            <div className="timeline-item" key={item.title}>
              <span className={cx("timeline-dot", item.tone)} />
              {index < roadmap.length - 1 && <span className="timeline-line" />}
              <div>
                <small>{item.status}</small>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </div>
          ))}
        </Panel>
        <Panel className="decision-panel">
          <h2>Kenapa target berubah?</h2>
          <p>
            Sistem membaca frekuensi catatan, area perkembangan, dan konteks
            kejadian. Backend bisa mengirim `confidenceScore` agar UI menampilkan
            seberapa kuat pola yang ditemukan.
          </p>
          <div className="evidence-list">
            <span>6 catatan mendukung kontak mata</span>
            <span>2 foto menunjukkan sensory play</span>
            <span>1 pola transisi perlu perhatian</span>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Progress({
  entries,
  selectedArea,
  setSelectedArea,
  addEntry,
}: {
  entries: ProgressEntry[];
  selectedArea: Area | "Semua";
  setSelectedArea: (area: Area | "Semua") => void;
  addEntry: (entry: {
    area: Area;
    inputType: ProgressEntry["type"];
    note: string;
    title?: string;
  }) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [type, setType] = useState<ProgressEntry["type"]>("Teks");
  const [area, setArea] = useState<Area>("Komunikasi");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    setIsSubmitting(true);
    void addEntry({
      inputType: type,
      area,
      note,
      title:
        type === "Teks"
          ? "Catatan perkembangan baru"
          : type === "Foto"
            ? "Observasi dari aktivitas visual"
            : "Ringkasan voice note orang tua",
    })
      .then(() => {
        setNote("");
      })
      .catch((error) => {
        console.error("Failed to save progress entry", error);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <WorkspaceHeader
        title="Catat perkembangan hari ini"
        body="Alur ini sengaja dibuat lengkap untuk backend: pilih jenis input, area perkembangan, isi catatan, lalu hasilnya masuk ke timeline."
      />
      <div className="progress-layout">
        <Panel className="entry-panel">
          <div className="input-mode">
            {(["Teks", "Foto", "Suara"] as ProgressEntry["type"][]).map((item) => (
              <button
                key={item}
                type="button"
                className={cx("mode-button", type === item && "active")}
                onClick={() => setType(item)}
              >
                {item === "Teks" && <FileText size={18} />}
                {item === "Foto" && <ImageIcon size={18} />}
                {item === "Suara" && <Mic size={18} />}
                {item}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="progress-form">
            <label>
              Area perkembangan
              <select value={area} onChange={(event) => setArea(event.target.value as Area)}>
                <option>Komunikasi</option>
                <option>Motorik</option>
                <option>Perilaku</option>
                <option>Akademik</option>
              </select>
            </label>
            <label>
              Catatan orang tua
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={7}
                placeholder="Tulis kejadian, pemicu, respons anak, dan perubahan yang terlihat hari ini."
              />
            </label>
            {type !== "Teks" && (
              <div className="upload-box">
                <Upload size={22} />
                <span>
                  Area upload frontend. Backend dapat menghubungkan file storage
                  dan media processing.
                </span>
              </div>
            )}
            <button className="primary-button full" type="submit" disabled={isSubmitting}>
              Simpan catatan <ArrowRight size={18} />
            </button>
          </form>
        </Panel>
        <Panel className="history-panel">
          <div className="panel-head">
            <h2>Timeline catatan</h2>
            <div className="filter-row">
              {(["Semua", "Komunikasi", "Motorik", "Perilaku", "Akademik"] as const).map(
                (item) => (
                  <button
                    key={item}
                    className={cx("filter-chip", selectedArea === item && "active")}
                    onClick={() => setSelectedArea(item)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="entry-list">
            {entries.length === 0 && (
              <article className="entry-card">
                <div>
                  <span className="entry-type">Belum ada catatan</span>
                  <h3>Timeline masih kosong</h3>
                  <p>Catatan perkembangan pertama akan muncul di sini setelah disimpan.</p>
                  <small>Pilih area lalu tambahkan observasi singkat dari hari ini.</small>
                </div>
              </article>
            )}
            {entries.map((entry) => (
              <article key={entry.id} className="entry-card">
                <div>
                  <span className="entry-type">{entry.type}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.note}</p>
                  <small>{entry.date} • {entry.area}</small>
                </div>
                <div className="entry-insight">
                  <Sparkles size={16} />
                  {entry.insight}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Education() {
  const [activeArticle, setActiveArticle] = useState(articles[0]);
  const [question, setQuestion] = useState("");
  const [assistantReply, setAssistantReply] = useState(
    "Coba gunakan timer visual 5 menit sebelum berhenti, lalu beri dua pilihan aktivitas berikutnya. Catat durasi tantrum selama satu minggu untuk melihat apakah pola membaik.",
  );

  const askAssistant = () => {
    const trimmed = question.trim();
    if (!trimmed) {
      setAssistantReply(
        "Tulis pertanyaan singkat dulu, misalnya tentang rutinitas, tantrum, komunikasi, atau persiapan konsultasi.",
      );
      return;
    }
    setAssistantReply(
      `Untuk pertanyaan "${trimmed}", mulai dari observasi 3 hal: kapan terjadi, apa pemicunya, dan apa yang membantu anak kembali tenang. Setelah itu simpan sebagai catatan agar pola mingguannya bisa terbaca.`,
    );
    setQuestion("");
  };

  return (
    <>
      <WorkspaceHeader
        title="Edukasi dan AI assistant"
        body="Konten edukasi dibuat ringkas dan praktis. AI assistant diposisikan sebagai panduan awal, bukan pengganti dokter."
      />
      <div className="education-layout">
        <Panel className="article-panel">
          <div className="search-box">
            <Search size={18} />
            <input aria-label="Cari artikel" placeholder="Cari autisme, rutinitas visual, speech delay" />
          </div>
          <div className="article-grid">
            {articles.map((article) => (
              <article key={article.title} className="article-card">
                <span>{article.category} • {article.readTime}</span>
                <h3>{article.title}</h3>
                <p>{article.body}</p>
                <button
                  className="text-button article-action"
                  onClick={() => setActiveArticle(article)}
                >
                  Baca ringkasan <ChevronRight size={18} />
                </button>
              </article>
            ))}
          </div>
          <div className="article-summary">
            <BookOpen size={20} />
            <div>
              <strong>{activeArticle.title}</strong>
              <p>{activeArticle.body}</p>
            </div>
          </div>
        </Panel>
        <Panel className="assistant-panel">
          <div className="assistant-head">
            <BrainCircuit size={24} />
            <h2>Tanya Tumbuh AI</h2>
          </div>
          <div className="chat-thread">
            <p className="chat user">
              Dafa sering tantrum saat berhenti menonton. Apa yang bisa dicoba?
            </p>
            <p className="chat ai">{assistantReply}</p>
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
            />
            <button aria-label="Kirim pertanyaan" onClick={askAssistant}>
              <ArrowRight size={18} />
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Consultation({
  profile,
  go,
}: {
  profile: ChildProfile;
  go: (screen: Screen) => void;
}) {
  const [selectedConsult, setSelectedConsult] = useState("Speech therapist");

  return (
    <>
      <WorkspaceHeader
        title="Rekomendasi konsultasi"
        body={`Berdasarkan fokus ${profile.name}, UI menampilkan alasan konsultasi dan data yang perlu dibawa.`}
      />
      <div className="consult-grid">
        {[
          {
            icon: <Stethoscope size={24} />,
            title: "Speech therapist",
            reason:
              "Komunikasi spontan mulai muncul, tetapi masih perlu prompt visual.",
            prepare:
              "Bawa ringkasan 2 minggu: kata yang muncul, situasi, dan respons setelah prompt.",
          },
          {
            icon: <HeartHandshake size={24} />,
            title: "Psikolog anak",
            reason:
              "Pola tantrum terlihat terkait transisi aktivitas dan perubahan rutinitas.",
            prepare:
              "Bawa catatan pemicu, durasi tantrum, dan strategi yang sudah dicoba.",
          },
          {
            icon: <MapPin size={24} />,
            title: "Fasilitas terdekat",
            reason:
              "Fitur lokasi dapat diaktifkan bila orang tua memberi izin eksplisit.",
            prepare:
              "Backend perlu consent lokasi dan filter jarak, spesialisasi, serta jam layanan.",
          },
        ].map((item) => (
          <Panel
            key={item.title}
            className={cx(
              "consult-card",
              selectedConsult === item.title && "selected",
            )}
          >
            <span className="consult-icon">{item.icon}</span>
            <h2>{item.title}</h2>
            <p>{item.reason}</p>
            <div>
              <strong>Yang perlu disiapkan</strong>
              <span>{item.prepare}</span>
            </div>
            <button
              className="secondary-button consult-action"
              onClick={() => {
                setSelectedConsult(item.title);
                go("progress");
              }}
            >
              Siapkan catatan <ArrowRight size={18} />
            </button>
          </Panel>
        ))}
      </div>
    </>
  );
}

function BackendHandoff() {
  const [activeContract, setActiveContract] = useState(backendContracts[0].endpoint);

  return (
    <>
      <WorkspaceHeader
        title="Backend handoff"
        body="Bagian ini membantu temanmu memahami data, endpoint, dan integrasi yang dibutuhkan tanpa menebak dari UI."
      />
      <div className="handoff-grid">
        {backendContracts.map((contract) => (
          <Panel
            key={contract.endpoint}
            className={cx(
              "contract-card",
              activeContract === contract.endpoint && "selected",
            )}
          >
            <code>{contract.endpoint}</code>
            <h2>{contract.purpose}</h2>
            <p>{contract.fields}</p>
            <button
              className="text-button contract-action"
              onClick={() => setActiveContract(contract.endpoint)}
            >
              Tandai endpoint aktif <CheckCircle2 size={18} />
            </button>
          </Panel>
        ))}
      </div>
      <Panel className="risk-panel">
        <CircleAlert size={24} />
        <div>
          <h2>Catatan etika produk</h2>
          <p>
            Jangan menampilkan diagnosis otomatis. Gunakan bahasa “indikasi”,
            “pola yang perlu diperhatikan”, dan “bahan diskusi dengan
            profesional”. Untuk data foto, suara, lokasi, dan dokumen medis,
            backend wajib menyediakan consent dan audit trail.
          </p>
        </div>
      </Panel>
    </>
  );
}

function WorkspaceHeader({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="workspace-header">
      <div>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {action}
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="feature-card">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx("panel", className)}>{children}</section>;
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className={cx("metric-card", tone)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function RoadmapStrip() {
  return (
    <div className="roadmap-strip">
      {roadmap.map((item) => (
        <article key={item.title} className={cx("strip-item", item.tone)}>
          <span />
          <strong>{item.title}</strong>
          <small>{item.status}</small>
        </article>
      ))}
    </div>
  );
}
