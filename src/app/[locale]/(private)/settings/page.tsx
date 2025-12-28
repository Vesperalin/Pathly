import { createProfile, getProfile } from "@/features/profiles/profile.service";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDto } from "@/types";
import { redirect } from "next/navigation";
import SettingsView from "./SettingsView";

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function fetchProfile(locale: string): Promise<ProfileDto> {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/login`);
  }

  let profile = await getProfile(supabase, user.id);

  // Create profile if it doesn't exist
  if (!profile) {
    profile = await createProfile(supabase, user.id);
  }

  return profile;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const profile = await fetchProfile(locale);

  return <SettingsView initialProfile={profile} />;
}
