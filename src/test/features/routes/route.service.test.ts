import { createRoute, getRouteDetails, updateRoute } from "@/features/routes/route.service";
import { ForbiddenError } from "@/lib/errors";
import { createSupabaseClientMock } from "@/test/utils/supabaseMock";
import { vi } from "vitest";

const routeRpcPayload = {
  id: "route-1",
  name: "Turbacz",
  route_date: "2024-01-01",
  distance: 12000,
  total_ascent: 850,
  total_descent: 820,
  duration: 14400,
  got_points: 20,
  notes: "Pierwsza wycieczka",
  created_at: "2024-01-02T10:00:00Z",
  updated_at: "2024-01-02T10:00:00Z",
  mountain_groups: [{ id: "mg-1", name: "Gorce" }],
  catalogs: [{ id: "cat-1", name: "Ulubione" }],
};

describe("routes and RLS", () => {
  it("creates a route and assigns it to user catalogs", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: routeRpcPayload,
      error: null,
    });
    const supabase = createSupabaseClientMock({
      rpc: rpcMock,
    });

    const result = await createRoute(
      supabase,
      {
        name: "Turbacz",
        route_date: "2024-01-01",
        distance: 12000,
        total_ascent: 850,
        total_descent: 820,
        duration: 14400,
        got_points: 20,
        notes: "Pierwsza wycieczka",
        catalog_ids: ["cat-1"],
        mountain_group_ids: ["mg-1"],
      },
      "user-1"
    );

    expect(rpcMock).toHaveBeenCalledWith(
      "create_route_with_associations",
      expect.objectContaining({ p_user_id: "user-1" })
    );
    expect(result.catalogs).toHaveLength(1);
    expect(result.mountain_groups).toHaveLength(1);
  });

  it("returns null when reading another user's route", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        routes: {
          onSelect: () =>
            Promise.resolve({
              data: null,
              error: { code: "PGRST116", message: "No rows" },
            }),
        },
      },
    });

    const result = await getRouteDetails(supabase, "route-unknown", "user-2");
    expect(result).toBeNull();
  });

  it("reads own route details together with catalogs", async () => {
    const supabase = createSupabaseClientMock({
      tables: {
        routes: {
          onSelect: () =>
            Promise.resolve({
              data: {
                id: "route-1",
                name: "Turbacz",
                route_date: "2024-01-01",
                got_points: 20,
                distance: 12000,
                total_ascent: 850,
                total_descent: 820,
                duration: 14400,
                notes: "Wycieczka",
                created_at: "2024-01-02T10:00:00Z",
                updated_at: "2024-01-02T10:00:00Z",
                route_mountain_groups: [{ mountain_groups: { id: "mg-1", name: "Gorce" } }],
                route_catalogs: [{ catalogs: { id: "cat-1", name: "Ulubione" } }],
              },
              error: null,
            }),
        },
      },
    });

    const result = await getRouteDetails(supabase, "route-1", "user-1");

    expect(result?.name).toBe("Turbacz");
    expect(result?.mountain_groups[0]).toEqual({ id: "mg-1", name: "Gorce" });
    expect(result?.catalogs[0]).toEqual({ id: "cat-1", name: "Ulubione" });
  });

  it("throws ForbiddenError when editing another user's route", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "FORBIDDEN: Route belongs to another user", code: "42501" },
    });
    const supabase = createSupabaseClientMock({ rpc: rpcMock });

    await expect(
      updateRoute(
        supabase,
        "route-1",
        {
          name: "Nowa nazwa",
          catalog_ids: [],
        },
        "user-2"
      )
    ).rejects.toThrow(ForbiddenError);
  });
});
