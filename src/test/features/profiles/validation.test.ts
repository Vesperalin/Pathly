import { UpdateProfileCommandSchema } from "@/features/profiles/validation";

describe("personalization validation", () => {
  it("allows changing the language", () => {
    const result = UpdateProfileCommandSchema.safeParse({ language: "pl" });
    expect(result.success).toBe(true);
  });

  it("allows changing the theme", () => {
    const result = UpdateProfileCommandSchema.safeParse({ theme: "dark" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty payload", () => {
    const result = UpdateProfileCommandSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
