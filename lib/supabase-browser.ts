"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.localStorage,
      storageKey: "tumbuh.auth",
    },
  });

  return cachedClient;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

export function isSupabaseAuthConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof window !== "undefined" && !url) {
    // Bantu debug: kalau banner "belum dikonfigurasi" muncul, cek console dulu.
    // eslint-disable-next-line no-console
    console.warn("[tumbuh] NEXT_PUBLIC_SUPABASE_URL kosong di bundle:", {
      url,
      hasKey: Boolean(key),
    });
  }
  return Boolean(url && key);
}
