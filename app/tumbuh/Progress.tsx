import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Mic,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Panel, WorkspaceHeader } from "./components";
import {
  progressEmptyState,
  progressHeaderBody,
  toChildContext,
} from "./personalize";
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
  const [note, setNote] = useState("");
  const [type, setType] = useState<ProgressEntry["type"]>("Teks");
  const [area, setArea] = useState<Area>("Komunikasi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [editingArea, setEditingArea] = useState<Area>("Komunikasi");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    if (type !== "Teks" && !selectedFile) return;
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
      file: selectedFile,
    })
      .then(() => {
        setNote("");
        setSelectedFile(null);
      })
      .catch((error) => {
        console.error("Failed to save progress entry", error);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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

  const ctx = toChildContext(profile, activeChild);
  const emptyState = progressEmptyState(ctx);

  return (
    <>
      <WorkspaceHeader
        title="Catat perkembangan hari ini"
        body={progressHeaderBody(ctx)}
      />
      <div className="progress-layout">
        <Panel className="entry-panel">
          <div className="input-mode">
            {(["Teks", "Foto", "Suara"] as ProgressEntry["type"][]).map(
              (item) => (
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
              ),
            )}
          </div>
          <form onSubmit={submit} className="progress-form">
            <label>
              Area perkembangan
              <select
                value={area}
                onChange={(event) => setArea(event.target.value as Area)}
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
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={7}
                placeholder="Tulis kejadian, pemicu, respons anak, dan perubahan yang terlihat hari ini."
              />
            </label>
            {type !== "Teks" && (
              <div className="upload-box">
                <Upload size={22} />
                <div>
                  <span>
                    {selectedFile
                      ? `File terpilih: ${selectedFile.name}`
                      : type === "Foto"
                        ? "Pilih foto untuk diunggah ke backend."
                        : "Pilih file audio untuk diunggah ke backend."}
                  </span>
                  <input
                    type="file"
                    accept={type === "Foto" ? "image/*" : "audio/*"}
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] ?? null)
                    }
                  />
                </div>
              </div>
            )}
            <button
              className="primary-button full"
              type="submit"
              disabled={isSubmitting}
            >
              Simpan catatan <ArrowRight size={18} />
            </button>
          </form>
        </Panel>
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
      </div>
    </>
  );
}
