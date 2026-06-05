import "server-only";

import { createClient } from "@supabase/supabase-js";

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
