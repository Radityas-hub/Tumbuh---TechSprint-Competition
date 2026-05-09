"use client";

import { ArrowRight, Download, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "./api";
import { Panel, WorkspaceHeader } from "./components";
import type { ChildApiModel, GuardianProfile, Screen } from "./types";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "../../lib/supabase-browser";

type Props = {
  guardian: GuardianProfile | null;
  activeChild: ChildApiModel | null;
  onDataCleared: () => Promise<void> | void;
  go: (screen: Screen) => void;
};

export function Settings({ guardian, activeChild, onDataCleared, go: _go }: Props) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSignOut = isSupabaseAuthConfigured();

  async function handleExport() {
    if (!activeChild) return;
    setExporting(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest<Record<string, unknown>>(
        `/api/children/${activeChild.id}/export`,
      );
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tumbuh-${activeChild.name}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback("Data anak berhasil diekspor ke file JSON.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengekspor data.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAll() {
    if (!activeChild) return;
    if (confirmText.trim().toLowerCase() !== "hapus") {
      setErrorMsg('Ketik "hapus" untuk konfirmasi.');
      return;
    }
    setDeleting(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/api/children/${activeChild.id}`, {
        method: "DELETE",
      });
      setConfirmText("");
      setFeedback(
        `Semua catatan, media, roadmap, dan insight untuk ${activeChild.name} telah dihapus.`,
      );
      await onDataCleared();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menghapus data.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const client = getSupabaseBrowserClient();
      if (client) {
        await client.auth.signOut();
      }
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <WorkspaceHeader
        title="Pengaturan & data"
        body="Kelola akun Anda dan kontrol penuh atas data anak yang tersimpan di Tumbuh."
      />

      {feedback ? (
        <Panel className="insight-callout">
          <p>{feedback}</p>
        </Panel>
      ) : null}
      {errorMsg ? (
        <Panel className="insight-callout is-error">
          <p>{errorMsg}</p>
        </Panel>
      ) : null}

      <div className="settings-grid">
        <Panel>
          <h2>Akun</h2>
          <dl className="settings-list">
            <div>
              <dt>Email</dt>
              <dd>{guardian?.email ?? "Belum masuk"}</dd>
            </div>
            <div>
              <dt>Nama tampilan</dt>
              <dd>{guardian?.displayName || "Belum diatur"}</dd>
            </div>
            <div>
              <dt>Akun aktif sejak</dt>
              <dd>
                {guardian?.createdAt
                  ? new Date(guardian.createdAt).toLocaleDateString("id-ID")
                  : "-"}
              </dd>
            </div>
          </dl>
          {canSignOut ? (
            <button
              className="secondary-button"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={16} />
              {signingOut ? "Keluar..." : "Keluar dari akun"}
            </button>
          ) : (
            <p className="settings-note">
              Supabase auth belum aktif (mode dev). Set
              <code> NEXT_PUBLIC_SUPABASE_URL</code> dan
              <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code> untuk mengaktifkan
              login.
            </p>
          )}
        </Panel>

        <Panel>
          <h2>Ekspor data</h2>
          <p>
            Unduh semua catatan, media, roadmap, dan insight{" "}
            {activeChild ? activeChild.name : "anak"} dalam format JSON. Berguna
            untuk dibawa ke dokter atau backup pribadi.
          </p>
          <button
            className="secondary-button"
            onClick={handleExport}
            disabled={exporting || !activeChild}
          >
            <Download size={16} />
            {exporting ? "Mengekspor..." : "Unduh data anak"}
          </button>
        </Panel>

        <Panel className="wide-panel danger-panel">
          <h2>Hapus semua progres</h2>
          <p>
            Tindakan ini akan menghapus seluruh catatan, foto, suara, roadmap,
            dan insight untuk
            <strong> {activeChild ? activeChild.name : "anak"}</strong>. Data
            tidak bisa dipulihkan dari UI. Pastikan Anda sudah mengekspor data
            penting sebelum menghapus.
          </p>
          <label className="danger-confirm">
            Ketik <strong>hapus</strong> untuk konfirmasi
            <input
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="hapus"
            />
          </label>
          <button
            className="danger-button"
            onClick={handleDeleteAll}
            disabled={
              deleting || !activeChild || confirmText.trim().toLowerCase() !== "hapus"
            }
          >
            <Trash2 size={16} />
            {deleting ? "Menghapus..." : "Hapus semua progres"}
            <ArrowRight size={16} />
          </button>
        </Panel>
      </div>
    </>
  );
}
