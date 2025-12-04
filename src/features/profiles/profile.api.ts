import type { ProfileDto, UpdateProfileCommand } from "@/types";

export const PROFILE_ENDPOINT = "/api/profiles/me";

export async function profileFetcher(url: string): Promise<ProfileDto> {
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load profile.");
  }

  return await response.json();
}

export async function patchProfile(command: UpdateProfileCommand): Promise<ProfileDto> {
  const response = await fetch(PROFILE_ENDPOINT, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = (errorBody && (errorBody.message || errorBody.error)) || "Failed to update profile.";
    throw new Error(message);
  }

  return await response.json();
}
