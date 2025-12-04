import { PROFILE_ENDPOINT, profileFetcher } from "@/features/profiles/profile.api";
import type { ProfileDto } from "@/types";
import useSWR from "swr";

interface UseProfileReturn {
  profile: ProfileDto | undefined;
  error: unknown;
  mutate: ReturnType<typeof useSWR<ProfileDto>>["mutate"];
}

export function useProfile(initialProfile: ProfileDto): UseProfileReturn {
  const { data, error, mutate } = useSWR<ProfileDto>(PROFILE_ENDPOINT, profileFetcher, {
    fallbackData: initialProfile,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    profile: data,
    error,
    mutate,
  };
}
