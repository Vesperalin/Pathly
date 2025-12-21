import { getCatalogDetails } from "@/features/catalogs/catalog.service";
import {
  CatalogIdParamSchema,
  GetCatalogRoutesQuerySchema,
  type GetCatalogRoutesQuery,
} from "@/features/catalogs/validation";
import { handleApiError } from "@/lib/apiErrors";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ catalogId: string }> }) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const paramsValidation = CatalogIdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      throw new ValidationError("Invalid catalog ID", paramsValidation.error.flatten().fieldErrors);
    }

    const { catalogId } = paramsValidation.data;

    const searchParams = new URL(request.url).searchParams;
    const queryValidation = GetCatalogRoutesQuerySchema.safeParse({
      page: searchParams.get("page"),
      page_size: searchParams.get("page_size"),
      sort_by: searchParams.get("sort_by"),
      order: searchParams.get("order"),
    });

    if (!queryValidation.success) {
      throw new ValidationError("Invalid query parameters", queryValidation.error.flatten().fieldErrors);
    }

    const query = queryValidation.data as GetCatalogRoutesQuery;

    const catalogDetails = await getCatalogDetails(supabase, catalogId, user.id, {
      routes_page: query.page,
      routes_page_size: query.page_size,
      routes_sort_by: query.sort_by,
      routes_order: query.order,
    });

    if (!catalogDetails) {
      throw new NotFoundError("Catalog not found or you don't have permission to view it.");
    }

    return NextResponse.json(catalogDetails.routes, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
