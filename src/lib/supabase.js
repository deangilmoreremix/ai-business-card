import { createClient } from "@supabase/supabase-js";

let _adminClient = null;
let _publicClient = null;

function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return null;
  _adminClient = createClient(url, serviceKey || anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _adminClient;
}

function getSupabasePublic() {
  if (_publicClient) return _publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return null;
  _publicClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _publicClient;
}

// Lazy proxies - only initialize when accessed at runtime, not at build time
export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error("Supabase admin client not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const supabasePublic = new Proxy({}, {
  get(target, prop) {
    const client = getSupabasePublic();
    if (!client) {
      throw new Error("Supabase public client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});