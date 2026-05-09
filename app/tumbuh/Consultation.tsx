import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";

import { apiRequest } from "./api";
import { Panel, WorkspaceHeader } from "./components";
import {
  consultationHeaderBody,
  toChildContext,
} from "./personalize";
import type {
  ChildApiModel,
  ChildProfile,
  ConsultationRecommendationApiModel,
  ConsultationResponse,
  Screen,
} from "./types";
import { cx } from "./utils";

export function Consultation({
  profile,
  go,
  activeChildId,
  activeChild,
}: {
  profile: ChildProfile;
  go: (screen: Screen) => void;
  activeChildId: string | null;
  activeChild: ChildApiModel | null;
}) {
  const ctx = toChildContext(profile, activeChild);
  const [selectedConsult, setSelectedConsult] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<
    ConsultationRecommendationApiModel[]
  >([]);
  const [latestInsightSummary, setLatestInsightSummary] = useState<
    string | null
  >(null);
  const [consultationMeta, setConsultationMeta] = useState<
    ConsultationResponse["meta"] | null
  >(null);

  useEffect(() => {
    if (!activeChildId) {
      setRecommendations([]);
      setLatestInsightSummary(null);
      setConsultationMeta(null);
      return;
    }

    let cancelled = false;

    async function loadRecommendations() {
      try {
        const data = await apiRequest<ConsultationResponse>(
          `/api/children/${activeChildId}/consultations/recommendations`,
        );

        if (cancelled) {
          return;
        }

        setRecommendations(data.recommendations);
        setLatestInsightSummary(data.latestInsightSummary);
        setConsultationMeta(data.meta);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load consultation recommendations", error);
        }
      }
    }

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [activeChildId]);

  const shouldUsePlaceholder =
    consultationMeta?.shouldUsePlaceholder ?? recommendations.length === 0;

  const consultCards = recommendations.map((item) => ({
    icon: item.specialty.toLowerCase().includes("speech") ? (
      <Stethoscope size={24} />
    ) : item.specialty.toLowerCase().includes("psikolog") ? (
      <HeartHandshake size={24} />
    ) : (
      <MapPin size={24} />
    ),
    title: item.title,
    reason: item.reason,
    prepare: item.prepare,
  }));

  return (
    <>
      <WorkspaceHeader
        title="Rekomendasi konsultasi"
        body={consultationHeaderBody(ctx, shouldUsePlaceholder)}
      />
      {!shouldUsePlaceholder && latestInsightSummary ? (
        <Panel className="insight-callout">
          <div className="insight-callout-head">
            <Sparkles size={18} />
            <strong>Insight terbaru</strong>
          </div>
          <p>{latestInsightSummary}</p>
        </Panel>
      ) : null}
      <div className="consult-grid">
        {consultCards.length === 0 && (
          <Panel className="consult-card">
            <h2>Belum ada rekomendasi</h2>
            <p>
              Tambahkan progress dan insight agar backend bisa menyusun
              rekomendasi konsultasi yang lebih relevan.
            </p>
          </Panel>
        )}
        {consultCards.map((item) => (
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
