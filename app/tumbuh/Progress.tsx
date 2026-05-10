import {
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Panel, WorkspaceHeader } from "./components";
import {
  progressEmptyState,
  progressHeaderBody,
  toChildContext,
  childReferenceName,
} from "./personalize";
import { QuickNote } from "./QuickNote";
import { TimelineSkeleton } from "./skeletons";
import type { Area, ChildApiModel, ChildProfile, ProgressEntry } from "./types";
import { cx } from "./utils";

export function Progress({
  entries,
  selectedArea,
  setSelectedArea,
  addEntry,
  updateEntry,
  deleteEntry,
  profile,
  activeChild,
  isLoading,
}: {
  entries: ProgressEntry[];
  selectedArea: Area | "Semua";
  setSelectedArea: (area: Area | "Semua") => void;
  addEntry: (entry: {
    area: Area;
    inputType: ProgressEntry["type"];
    note: string;
    title?: string;
    file?: File | null;
  }) => Promise<void>;
  updateEntry: (
    entryId: string,
    entry: {
      area: Area;
      note: string;
      title?: string | null;
    },
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  profile: ChildProfile;
  activeChild: ChildApiModel | null;
  isLoading: boolean;
}) {
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [editingArea, setEditingArea] = useState<Area>("Komunikasi");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  const ctx = toChildContext(profile, activeChild);
  const childName = childReferenceName(ctx);
  const emptyState = progressEmptyState(ctx);

  const startEditing = (entry: ProgressEntry) => {
    setEditingEntryId(entry.id);
    setEditingNote(entry.note);
    setEditingArea(entry.area);
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditingNote("");
    setEditingArea("Komunikasi");
  };

  const submitEdit = (entry: ProgressEntry) => {
    if (!editingNote.trim()) return;

    setIsEditingSubmitting(true);
    void updateEntry(entry.id, {
      area: editingArea,
      note: editingNote.trim(),
      title: entry.title,
    })
      .then(() => {
        cancelEditing();
      })
      .catch((error) => {
        console.error("Failed to update progress entry", error);
      })
      .finally(() => {
        setIsEditingSubmitting(false);
      });
  };

  const removeEntry = (entryId: string) => {
    setDeletingEntryId(entryId);
    void deleteEntry(entryId)
      .catch((error) => {
        console.error("Failed to delete progress entry", error);
      })
      .finally(() => {
        setDeletingEntryId(null);
      });
  };

  return (
    <>
      <WorkspaceHeader
        title="Catatan perkembangan"
        body={progressHeaderBody(ctx)}
        action={
          <button
            className="primary-button"
            onClick={() => setQuickNoteOpen(true)}
          >
            <Plus size={18} /> Tambah catatan
          </button>
        }
      />

      {/* Timeline */}
      <Panel className="history-panel">
        <div className="panel-head">
          <h2>Timeline catatan</h2>
          <div className="filter-row">
            {(
              [
                "Semua",
                "Komunikasi",
                "Motorik",
                "Perilaku",
                "Akademik",
              ] as const
            ).map((item) => (
              <button
                key={item}
                className={cx(
                  "filter-chip",
                  selectedArea === item && "active",
                )}
                onClick={() => setSelectedArea(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="entry-list">
          {entries.length === 0 && (
            <article className="entry-card">
              <div>
                <span className="entry-type">{emptyState.badge}</span>
                <h3>{emptyState.title}</h3>
                <p>{emptyState.body}</p>
              </div>
            </article>
          )}
          {entries.map((entry) => (
            <article key={entry.id} className="entry-card">
              <div>
                <span className="entry-type">{entry.type}</span>
                <h3>{entry.title}</h3>
                {editingEntryId === entry.id ? (
                  <div className="progress-edit-form">
                    <label>
                      Area perkembangan
                      <select
                        value={editingArea}
                        onChange={(event) =>
                          setEditingArea(event.target.value as Area)
                        }
                      >
                        <option>Komunikasi</option>
                        <option>Motorik</option>
                        <option>Perilaku</option>
                        <option>Akademik</option>
                      </select>
                    </label>
                    <label>
                      Catatan orang tua
                      <textarea
                        value={editingNote}
                        onChange={(event) => setEditingNote(event.target.value)}
                        rows={5}
                      />
                    </label>
                    <div className="entry-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => submitEdit(entry)}
                        disabled={isEditingSubmitting}
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={cancelEditing}
                        disabled={isEditingSubmitting}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{entry.note}</p>
                )}
                {entry.type === "Foto" && entry.mediaUrl ? (
                  <div className="entry-photo-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.mediaUrl} alt={entry.title} />
                  </div>
                ) : null}
                {entry.mediaStatusLabel ? (
                  <small>
                    Media {entry.mediaStatusLabel}
                    {entry.mediaProcessingError
                      ? ` - ${entry.mediaProcessingError}`
                      : ""}
                  </small>
                ) : null}
                <small>
                  {entry.date} • {entry.area}
                </small>
                {editingEntryId !== entry.id ? (
                  <div className="entry-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => startEditing(entry)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => removeEntry(entry.id)}
                      disabled={deletingEntryId === entry.id}
                    >
                      Hapus <Trash2 size={16} />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="entry-insight">
                <Sparkles size={16} />
                {entry.insight}
              </div>
            </article>
          ))}
        </div>
      </Panel>

      {/* Quick note modal */}
      <QuickNote
        open={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
        onSubmit={addEntry}
        childName={childName}
      />
    </>
  );
}
