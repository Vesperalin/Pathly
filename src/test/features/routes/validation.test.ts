import { CreateRouteCommandSchema, UpdateRouteCommandSchema } from "@/features/routes/validation";

describe("route details and assignments", () => {
  it("requires full GPX-derived data when creating a route", () => {
    const result = CreateRouteCommandSchema.safeParse({
      name: "",
      route_date: "2024-01-01",
      distance: 1000,
      total_ascent: 200,
      total_descent: 200,
      duration: 3600,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("rejects edits to GPX-derived fields", () => {
    const result = UpdateRouteCommandSchema.safeParse({
      distance: 1000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Unrecognized key: "distance"');
    }
  });

  it("allows updating catalog and mountain group assignments", () => {
    const result = UpdateRouteCommandSchema.safeParse({
      catalog_ids: ["9c36e995-2afe-4e91-9d06-0a83b9c2fade"],
      mountain_group_ids: ["c1abcb7c-da1a-49cc-b5c7-6e333b575b0c"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.catalog_ids).toHaveLength(1);
    }
  });
});
