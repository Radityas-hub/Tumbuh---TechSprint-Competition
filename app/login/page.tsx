"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ArrowRight, Mail, Lock } from "lucide-react";

import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "../../lib/supabase-browser";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-page" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "/dashboard";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseAuthConfigured()) {
      setError(
        "Supabase auth belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY lalu reload.",
      );
      setReady(true);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        router.replace(nextPath);
        return;
      }
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Supabase client belum siap.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || null,
            },
          },
        });
        if (signUpError) {
          throw signUpError;
        }

        if (!data.session) {
          setInfo(
            "Cek email Anda untuk verifikasi akun. Setelah verifikasi, kembali ke halaman login.",
          );
          return;
        }
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      }

      router.replace(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" href="/">
          Tumbuh
        </Link>
        <h1>
          {mode === "signin"
            ? "Masuk untuk melanjutkan"
            : "Buat akun untuk menyimpan progres"}
        </h1>
        <p className="auth-lead">
          {mode === "signin"
            ? "Progres anak Anda tersimpan dan bisa diakses kapan saja."
            : "Kami akan simpan semua catatan anak di akun ini agar tidak hilang."}
        </p>

        {error ? <div className="auth-error">{error}</div> : null}
        {info ? <div className="auth-info">{info}</div> : null}

        {ready ? (
          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" ? (
              <label>
                Nama tampilan
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Mis. Ibu Sarah"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label>
              Email
              <span className="auth-input">
                <Mail size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </span>
            </label>

            <label>
              Kata sandi
              <span className="auth-input">
                <Lock size={16} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
              </span>
            </label>

            <button
              className="primary-button full"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Memproses..."
                : mode === "signin"
                  ? "Masuk"
                  : "Buat akun"}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <p className="auth-info">Memuat...</p>
        )}

        <div className="auth-switch">
          {mode === "signin" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
              >
                Daftar
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
              >
                Masuk
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
