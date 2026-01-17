import { updateProfile } from "@/features/profiles/profile.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createSupabaseClientMock } from "@/test/utils/supabaseMock";

describe("profile updates", () => {
  it("requires at least one field to update", async () => {
    const supabase = createSupabaseClientMock({ tables: { profiles: {} } });

    await expect(updateProfile(supabase, "user-1", {})).rejects.toThrow(ValidationError);
  });

  it("updates language and theme", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        profiles: {
          onUpdate: () =>
            Promise.resolve({
              data: {
                id: "user-1",
                language: "pl",
                theme: "dark",
                created_at: "2024-01-01T00:00:00Z",
              },
              error: null,
            }),
        },
      },
    });

    const result = await updateProfile(supabase, "user-1", {
      language: "pl",
      theme: "dark",
    });

    expect(result.language).toBe("pl");
    expect(result.theme).toBe("dark");
  });

  it("throws NotFound when the profile does not exist", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        profiles: {
          onUpdate: () =>
            Promise.resolve({
              data: null,
              error: { code: "PGRST116", message: "No rows" },
            }),
        },
      },
    });

    await expect(updateProfile(supabase, "user-1", { language: "en" })).rejects.toThrow(NotFoundError);
  });
});
