import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Mic,
  Upload,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import type { Area, ProgressEntry } from "./types";
import { cx } from "./utils";

type QuickNoteProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: {
    area: Area;
    inputType: ProgressEntry["type"];
    note: string;
    title?: string;
    file?: File | null;
  }) => Promise<void>;
  childName: string;
};

export function QuickNote({ open, onClose, onSubmit, childName }: QuickNoteProps) {
  const [note, setNote] = useState("");
  const [type, setType] = useState<ProgressEntry["type"]>("Teks");
  const [area, setArea] = useState<Area>("Komunikasi");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    if (type !== "Teks" && !selectedFile) return;

    setIsSubmitting(true);
    void onSubmit({
      inputType: type,
      area,
      note: note.trim(),
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
        setType("Teks");
        setArea("Komunikasi");
        onClose();
      })
      .catch((error) => {
        console.error("Failed to save quick note", error);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="qn-backdrop" onClick={handleBackdropClick}>
      <div className="qn-sheet" role="dialog" aria-label="Catat perkembangan">
        {/* Header */}
        <div className="qn-header">
          <div>
            <h2>Catat perkembangan</h2>
            <p>Satu momen kecil untuk {childName} hari ini</p>
          </div>
          <button
            className="qn-close"
            onClick={onClose}
            aria-label="Tutup"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="qn-form">
          {/* Input type selector */}
          <div className="qn-type-row">
            {(["Teks", "Foto", "Suara"] as ProgressEntry["type"][]).map((item) => (
              <button
                key={item}
                type="button"
                className={cx("qn-type-btn", type === item && "active")}
                onClick={() => setType(item)}
              >
                {item === "Teks" && <FileText size={16} />}
                {item === "Foto" && <ImageIcon size={16} />}
                {item === "Suara" && <Mic size={16} />}
                {item}
              </button>
            ))}
          </div>

          {/* Area selector */}
          <div className="qn-area-row">
            {(["Komunikasi", "Motorik", "Perilaku", "Akademik"] as Area[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={cx("qn-area-btn", area === item && "active")}
                  onClick={() => setArea(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          {/* Note textarea */}
          <textarea
            className="qn-textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            placeholder="Apa yang Anda perhatikan hari ini? Tulis sesingkat atau selengkap yang Anda mau."
            autoFocus
          />

          {/* File upload (conditional) */}
          {type !== "Teks" && (
            <label className="qn-upload">
              <Upload size={18} />
              <span>
                {selectedFile
                  ? selectedFile.name
                  : type === "Foto"
                    ? "Pilih foto"
                    : "Pilih file audio"}
              </span>
              <input
                type="file"
                accept={type === "Foto" ? "image/*" : "audio/*"}
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
          )}

          {/* Submit */}
          <button
            className="primary-button full"
            type="submit"
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan catatan"}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
