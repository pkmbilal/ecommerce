import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import {
  getSupabaseServerKey,
  requireSupabasePublicEnv,
  requireSupabaseServerKey,
} from "./env";

export function createSupabaseServerClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();

  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function createSupabaseServiceClient() {
  const { url } = requireSupabasePublicEnv();
  const serverKey = requireSupabaseServerKey();

  return createClient<Database>(url, serverKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function createOptionalSupabaseServiceClient() {
  const { url } = requireSupabasePublicEnv();
  const serverKey = getSupabaseServerKey();

  if (!serverKey) {
    return null;
  }

  return createClient<Database>(url, serverKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function createSupabaseAuthServerClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. The proxy refreshes sessions.
        }
      },
    },
  });
}
