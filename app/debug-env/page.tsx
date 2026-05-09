"use client";

export default function DebugEnvPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "<undefined>";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12) + "…"
    : "<undefined>";

  return (
    <main style={{ padding: 32, fontFamily: "monospace", lineHeight: 1.6 }}>
      <h1>Debug env (browser bundle)</h1>
      <p>
        NEXT_PUBLIC_SUPABASE_URL = <strong>{url}</strong>
      </p>
      <p>
        NEXT_PUBLIC_SUPABASE_ANON_KEY prefix = <strong>{key}</strong>
      </p>
      <p style={{ marginTop: 24, color: "#888" }}>
        Kalau dua nilai di atas menunjukkan <code>&lt;undefined&gt;</code>,
        berarti build ini tidak punya env NEXT_PUBLIC yang di-set di Vercel.
        Redeploy tanpa cache atau perbaiki nama variabelnya.
      </p>
    </main>
  );
}
