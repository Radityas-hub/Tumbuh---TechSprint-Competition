import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type {
  Area,
  ChildProfile,
  OnboardingPayload,
  Screen,
} from "./types";
import { cx } from "./utils";

export function Onboarding({
  profile,
  setProfile: _setProfile,
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
        <span>
          Langkah {step} dari {totalSteps}
        </span>
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
                draft.condition === "Kondisi lain - perlu ditinjau" &&
                  "selected",
              )}
              onClick={() =>
                setDraft({
                  ...draft,
                  condition: "Kondisi lain - perlu ditinjau",
                })
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
