"use client";

import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Panel, WorkspaceHeader } from "./components";
import {
  childReferenceName,
  conditionPhrase,
  focusAreaPhrase,
  roadmapEmptyBody,
  toChildContext,
} from "./personalize";
import { RoadmapSkeleton } from "./skeletons";
import type {
  ChildApiModel,
  ChildProfile,
  InsightApiModel,
  RoadmapItemApiModel,
  RoadmapResponse,
} from "./types";
import { cx } from "./utils";

type RoadmapStatus = RoadmapItemApiModel["status"];

export function Roadmap({
  items,
  latestInsight,
  roadmapMeta,
  profile,
  activeChild,
  onItemUpdate,
  isAuthenticated,
  isLoading,
}: {
  items: RoadmapItemApiModel[];
  latestInsight: InsightApiModel | null;
  roadmapMeta: RoadmapResponse["meta"] | null;
  profile: ChildProfile;
  activeChild: ChildApiModel | null;
  onItemUpdate: (
    itemId: string,
    payload: { status?: RoadmapStatus; detail?: string | null },
  ) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  const ctx = toChildContext(profile, activeChild);
  const name = childReferenceName(ctx);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (isLoading) {
    return <RoadmapSkeleton name={name} />;
  }

  const shouldUsePlaceholder =
    roadmapMeta?.shouldUsePlaceholder ?? items.length === 0;
  const roadmap = shouldUsePlaceholder ? [] : items;
  const evidenceLines = roadmap.length
    ? Array.from(new Set([
        ...roadmap.flatMap((item) => item.evidence),
        ...(latestInsight?.alerts ?? []),
      ])).slice(0, 3)
    : [];

  const cond = conditionPhrase(ctx);
  const focus = focusAreaPhrase(ctx);
  const headerBody = cond
    ? `Milestone untuk ${name} dengan ${cond}, disusun per area ${focus}. Tandai tercapai begitu Anda yakin sudah konsisten.`
    : `Milestone untuk ${name}, disusun per area ${focus}. Tandai tercapai begitu Anda yakin sudah konsisten.`;

  const achievedCount = roadmap.filter((item) => item.status === "ACHIEVED").length;
  const inProgressCount = roadmap.filter(
    (item) => item.status === "IN_PROGRESS",
  ).length;

  async function toggleStatus(item: RoadmapItemApiModel) {
    if (!isAuthenticated || !onItemUpdate) return;
    const nextStatus: RoadmapStatus =
      item.status === "ACHIEVED" ? "IN_PROGRESS" : "ACHIEVED";
    setPendingId(item.id);
    try {
      await onItemUpdate(item.id, { status: nextStatus });
    } catch (error) {
      console.error("Failed to update roadmap status", error);
    } finally {
      setPendingId(null);
    }
  }

  async function bumpToInProgress(item: RoadmapItemApiModel) {
    if (!isAuthenticated || !onItemUpdate) return;
    if (item.status === "IN_PROGRESS") return;
    setPendingId(item.id);
    try {
      await onItemUpdate(item.id, { status: "IN_PROGRESS" });
    } catch (error) {
      console.error("Failed to update roadmap status", error);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <WorkspaceHeader title={`Roadmap ${name}`} body={headerBody} />
      {roadmap.length > 0 ? (
        <Panel className="roadmap-summary">
          <div>
            <strong>
              {achievedCount}/{roadmap.length} target tercapai
            </strong>
            <p>
              {inProgressCount > 0
                ? `${inProgressCount} target sedang aktif. Tandai tercapai begitu konsisten 5-7 hari.`
                : "Pilih satu target untuk jadi fokus aktif minggu ini."}
            </p>
          </div>
          <div
            className="roadmap-progress"
            style={{
              ['--progress' as never]: `${roadmap.length > 0 ? Math.round((achievedCount / roadmap.length) * 100) : 0}%`,
            }}
          >
            <span />
          </div>
        </Panel>
      ) : null}
      <div className="roadmap-layout">
        <Panel className="timeline-panel">
          {roadmap.length === 0 && (
            <div className="timeline-item">
              <div>
                <small>
                  {roadmapMeta?.isSeedOnly
                    ? "Baseline siap, menunggu data"
                    : "Belum ada roadmap"}
                </small>
                <h3>
                  {roadmapMeta?.isSeedOnly
                    ? `Tambahkan catatan untuk menggeser roadmap ${name}`
                    : `Roadmap ${name} masih kosong`}
                </h3>
                <p>{roadmapEmptyBody(ctx, Boolean(roadmapMeta?.isSeedOnly))}</p>
              </div>
            </div>
          )}
          {roadmap.filter((item) => item.status !== "ACHIEVED").length > 0 && (
            <div className="roadmap-section-label">Target aktif</div>
          )}
          {roadmap
            .filter((item) => item.status !== "ACHIEVED")
            .map((item, index, arr) => {
              const busy = pendingId === item.id;
              return (
                <div
                  className="timeline-item"
                  key={item.id}
                >
                  <span className={cx("timeline-dot", item.tone)} />
                  {index < arr.length - 1 && <span className="timeline-line" />}
                  <div>
                    <small>{item.statusLabel}</small>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    {isAuthenticated ? (
                      <div className="roadmap-item-actions">
                        <button
                          type="button"
                          className="roadmap-action"
                          onClick={() => toggleStatus(item)}
                          disabled={busy}
                        >
                          <CheckCircle2 size={14} /> Tandai tercapai
                        </button>
                        {item.status !== "IN_PROGRESS" ? (
                          <button
                            type="button"
                            className="roadmap-action secondary"
                            onClick={() => bumpToInProgress(item)}
                            disabled={busy}
                          >
                            <Circle size={14} /> Jadikan fokus
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          {roadmap.filter((item) => item.status === "ACHIEVED").length > 0 && (
            <div className="roadmap-section-label achieved">
              Tercapai ({roadmap.filter((item) => item.status === "ACHIEVED").length})
            </div>
          )}
          {roadmap
            .filter((item) => item.status === "ACHIEVED")
            .map((item, index, arr) => {
              const busy = pendingId === item.id;
              return (
                <div
                  className={cx("timeline-item", "is-achieved")}
                  key={item.id}
                >
                  <span className={cx("timeline-dot", item.tone)} />
                  {index < arr.length - 1 && <span className="timeline-line" />}
                  <div>
                    <small>{item.statusLabel}</small>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    {isAuthenticated ? (
                      <div className="roadmap-item-actions">
                        <button
                          type="button"
                          className={cx("roadmap-action", "is-achieved")}
                          onClick={() => toggleStatus(item)}
                          disabled={busy}
                        >
                          <RotateCcw size={14} /> Buka lagi
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
        </Panel>
        <Panel className="decision-panel">
          <h2>Kenapa target berubah?</h2>
          <p>
            Sistem membaca frekuensi catatan area {focus}, konteks kejadian,
            dan rutinitas yang Anda pilih saat onboarding. Saat Anda menandai
            target tercapai, KPI dashboard dan personalisasi berikutnya
            menyesuaikan otomatis.
          </p>
          {roadmapMeta?.personalizedAt && !shouldUsePlaceholder ? (
            <small>
              Terakhir diperbarui{" "}
              {new Date(roadmapMeta.personalizedAt).toLocaleString("id-ID")}
              {roadmapMeta.personalizationSource
                ? ` lewat ${roadmapMeta.personalizationSource === "llm" ? "Qwen" : roadmapMeta.personalizationSource === "curriculum_v1" ? "kurikulum awal" : "rule engine"}`
                : ""}
              .
            </small>
          ) : null}
          <div className="evidence-list">
            {evidenceLines.length === 0 && (
              <span>
                Evidence akan muncul setelah ada catatan area {focus} untuk{" "}
                {name} dan insight yang relevan.
              </span>
            )}
            {evidenceLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
