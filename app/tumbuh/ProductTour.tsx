import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";

type TourStep = {
  target: string;
  title: string;
  body: string;
  position?: "top" | "bottom" | "left" | "right";
};

// Tour for empty dashboard — focuses on sidebar navigation
const EMPTY_TOUR_STEPS: TourStep[] = [
  {
    target: ".sidebar-link:nth-child(3)", // Catatan
    title: "Catatan perkembangan",
    body: "Di sini Anda mencatat observasi harian. Satu kalimat singkat sudah cukup untuk memulai.",
    position: "right",
  },
  {
    target: ".sidebar-link:nth-child(2)", // Roadmap
    title: "Roadmap",
    body: "Target perkembangan anak. Akan terisi otomatis setelah ada beberapa catatan.",
    position: "right",
  },
  {
    target: ".sidebar-link:nth-child(4)", // Edukasi
    title: "Edukasi & Assistant",
    body: "Artikel dan AI assistant yang menjawab pertanyaan seputar perkembangan anak Anda.",
    position: "right",
  },
  {
    target: ".sidebar-link:nth-child(5)", // Konsultasi
    title: "Konsultasi",
    body: "Rekomendasi profesional berdasarkan catatan dan pola yang terdeteksi.",
    position: "right",
  },
  {
    target: ".dash-empty-content .primary-button",
    title: "Mulai dari sini",
    body: "Tambahkan catatan pertama — dashboard akan mulai hidup setelahnya.",
    position: "top",
  },
];

// Tour for filled dashboard — focuses on dashboard sections
const FULL_TOUR_STEPS: TourStep[] = [
  {
    target: ".dash-hero",
    title: "Ringkasan minggu ini",
    body: "Kondisi anak secara singkat. Semua dimulai dari catatan yang Anda tambahkan.",
    position: "bottom",
  },
  {
    target: ".dash-actions",
    title: "Aktivitas hari ini",
    body: "Rekomendasi yang disesuaikan dengan fokus anak. Klik 'Sudah' untuk langsung mencatat.",
    position: "right",
  },
  {
    target: ".dash-pulse",
    title: "Ritme mingguan",
    body: "Titik hijau = hari yang ada catatan. Tidak perlu setiap hari — yang penting konsisten.",
    position: "right",
  },
  {
    target: ".dash-focus",
    title: "Fokus perkembangan",
    body: "Target yang sedang berjalan. Lingkaran bergerak otomatis seiring catatan bertambah.",
    position: "left",
  },
  {
    target: ".dash-insight",
    title: "Ringkasan AI",
    body: "Sistem merangkum pola dari catatan Anda. Ini bahan diskusi, bukan diagnosis.",
    position: "left",
  },
];

const STORAGE_KEY_EMPTY = "tumbuh_tour_empty_done";
const STORAGE_KEY_FULL = "tumbuh_tour_full_done";

type ProductTourProps = {
  variant: "empty" | "full";
};

export function ProductTour({ variant }: ProductTourProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const storageKey = variant === "empty" ? STORAGE_KEY_EMPTY : STORAGE_KEY_FULL;
  const steps = variant === "empty" ? EMPTY_TOUR_STEPS : FULL_TOUR_STEPS;

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      const timer = setTimeout(() => setActive(true), 900);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const positionTooltip = useCallback(() => {
    if (!active) return;

    const currentStep = steps[step];
    const el = document.querySelector(currentStep.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pos = currentStep.position || "bottom";
    const padding = 10;

    setSpotlightStyle({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: "16px",
    });

    const tooltip: React.CSSProperties = { position: "fixed" };

    switch (pos) {
      case "bottom":
        tooltip.top = rect.bottom + 14;
        tooltip.left = Math.max(16, rect.left);
        break;
      case "top":
        tooltip.bottom = window.innerHeight - rect.top + 14;
        tooltip.left = Math.max(16, rect.left);
        break;
      case "right":
        tooltip.top = rect.top;
        tooltip.left = rect.right + 14;
        break;
      case "left":
        tooltip.top = rect.top;
        tooltip.right = window.innerWidth - rect.left + 14;
        break;
    }

    // Clamp tooltip so it doesn't overflow viewport
    if (tooltip.left && typeof tooltip.left === "number") {
      tooltip.left = Math.min(tooltip.left, window.innerWidth - 360);
    }

    setTooltipStyle(tooltip);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [active, step, steps]);

  useEffect(() => {
    positionTooltip();

    const handle = () => positionTooltip();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [positionTooltip]);

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      complete();
    }
  };

  const complete = () => {
    setActive(false);
    localStorage.setItem(storageKey, "true");
  };

  if (!active) return null;

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="tour-overlay">
      <div className="tour-backdrop" />
      <div className="tour-spotlight" style={spotlightStyle} />
      <div className="tour-tooltip" style={tooltipStyle} ref={tooltipRef}>
        <div className="tour-tooltip-header">
          <span className="tour-step-indicator">
            {step + 1} / {steps.length}
          </span>
          <button className="tour-skip" onClick={complete} type="button">
            <X size={16} />
          </button>
        </div>
        <h3 className="tour-tooltip-title">{currentStep.title}</h3>
        <p className="tour-tooltip-body">{currentStep.body}</p>
        <div className="tour-tooltip-footer">
          {step > 0 && (
            <button
              className="tour-btn-back"
              onClick={() => setStep(step - 1)}
              type="button"
            >
              Kembali
            </button>
          )}
          <button className="tour-btn-next" onClick={next} type="button">
            {isLast ? "Selesai" : "Lanjut"}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
