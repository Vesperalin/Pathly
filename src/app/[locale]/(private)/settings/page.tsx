import { getProfile } from "@/features/profiles/profile.service";
import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDto } from "@/types";
import { notFound } from "next/navigation";
import SettingsView from "./SettingsView";

async function fetchProfile(): Promise<ProfileDto> {
  const supabase = await createClient();
  const profile = await getProfile(supabase, DEFAULT_USER_ID);

  if (!profile) {
    notFound();
  }

  return profile;
}

export default async function SettingsPage() {
  const profile = await fetchProfile();

  return <SettingsView initialProfile={profile} />;
}
