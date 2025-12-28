import { createCatalog, deleteCatalog, updateCatalog } from "@/features/catalogs/catalog.service";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { createSupabaseClientMock } from "@/test/utils/supabaseMock";
import type { CatalogPreviewDto } from "@/types";
import { vi } from "vitest";

const baseCatalog = {
  id: "catalog-1",
  name: "Beskidy",
  is_predefined: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("catalog service", () => {
  it("creates a new user catalog", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        catalogs: {
          onInsert: () => Promise.resolve({ data: baseCatalog, error: null }),
        },
      },
    });

    const result = await createCatalog(supabase, { name: "Beskidy" }, "user-1");

    const expected: CatalogPreviewDto = {
      ...baseCatalog,
      total_points: 0,
    };
    expect(result).toEqual(expected);
  });

  it("throws ValidationError for invalid name", async () => {
    const supabase = createSupabaseClientMock({ tables: { catalogs: {} } });

    await expect(createCatalog(supabase, { name: "" }, "user-1")).rejects.toThrow(ValidationError);
  });

  it("blocks editing another user's catalog", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        catalogs: {
          onSelect: () =>
            Promise.resolve({
              data: { ...baseCatalog, user_id: "other-user" },
              error: null,
            }),
        },
      },
    });

    await expect(updateCatalog(supabase, "catalog-1", { name: "Tatry" }, "user-1")).rejects.toThrow(ForbiddenError);
  });

  it("blocks editing a predefined catalog", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        catalogs: {
          onSelect: () =>
            Promise.resolve({
              data: { ...baseCatalog, is_predefined: true, user_id: "user-1" },
              error: null,
            }),
        },
      },
    });

    await expect(updateCatalog(supabase, "catalog-1", { name: "Tatry" }, "user-1")).rejects.toThrow(ForbiddenError);
  });

  it("updates the user's catalog name", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        catalogs: {
          onSelect: () =>
            Promise.resolve({
              data: { ...baseCatalog, user_id: "user-1" },
              error: null,
            }),
          onUpdate: () =>
            Promise.resolve({
              data: { ...baseCatalog, name: "Tatry" },
              error: null,
            }),
        },
      },
    });

    const result = await updateCatalog(supabase, "catalog-1", { name: "Tatry" }, "user-1");

    expect(result.name).toBe("Tatry");
  });

  it("deletes a user catalog after confirmation", async () => {
    const onDelete = vi.fn().mockResolvedValue({ error: null });
    const supabase = createSupabaseClientMock({
      tables: {
        catalogs: {
          onSelect: () =>
            Promise.resolve({
              data: { ...baseCatalog, user_id: "user-1" },
              error: null,
            }),
          onDelete: onDelete,
        },
      },
    });

    await deleteCatalog(supabase, "catalog-1", "user-1");

    expect(onDelete).toHaveBeenCalledWith("id", "catalog-1");
  });

  it("blocks deleting a predefined catalog", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        catalogs: {
          onSelect: () =>
            Promise.resolve({
              data: { ...baseCatalog, user_id: "user-1", is_predefined: true },
              error: null,
            }),
        },
      },
    });

    await expect(deleteCatalog(supabase, "catalog-1", "user-1")).rejects.toThrow(ForbiddenError);
  });
});
