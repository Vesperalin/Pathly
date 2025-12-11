import type {
  CatalogDetailsDto,
  CatalogPreviewDto,
  CreateCatalogCommand,
  PaginatedCatalogsDto,
  PaginatedResponse,
  RouteInCatalogDto,
  UpdateCatalogCommand,
} from "@/types";

const CATALOGS_ENDPOINT = "/api/catalogs";

export type CatalogType = "predefined" | "user";

interface FetchCatalogsParams {
  type: CatalogType;
}

interface CatalogApiErrorInit {
  message: string;
  status: number;
  details?: unknown;
}

export class CatalogApiError extends Error {
  status: number;
  details?: unknown;

  constructor({ message, status, details }: CatalogApiErrorInit) {
    super(message);
    this.name = "CatalogApiError";
    this.status = status;
    this.details = details;
  }
}

function buildCatalogsUrl(params?: Partial<FetchCatalogsParams>) {
  const url = new URL(CATALOGS_ENDPOINT, typeof window === "undefined" ? "http://localhost" : window.location.origin);

  if (params?.type) {
    url.searchParams.set("type", params.type);
  }

  return `${url.pathname}${url.search}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await parseJson<Record<string, unknown>>(response);
    const message = (body?.message as string) || (body?.error as string) || "Request failed.";
    throw new CatalogApiError({
      message,
      status: response.status,
      details: body?.details,
    });
  }

  return parseJson<T>(response);
}

export async function fetchCatalogs({ type }: FetchCatalogsParams): Promise<CatalogPreviewDto[]> {
  const response = await fetch(buildCatalogsUrl({ type }), {
    credentials: "include",
  });

  const payload = await handleResponse<PaginatedCatalogsDto>(response);
  return payload.data ?? [];
}

export async function createCatalog(command: CreateCatalogCommand): Promise<CatalogPreviewDto> {
  const response = await fetch(CATALOGS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  return handleResponse<CatalogPreviewDto>(response);
}

export async function updateCatalog(catalogId: string, command: UpdateCatalogCommand): Promise<CatalogPreviewDto> {
  const response = await fetch(`${CATALOGS_ENDPOINT}/${catalogId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  return handleResponse<CatalogPreviewDto>(response);
}

export async function deleteCatalog(catalogId: string): Promise<void> {
  const response = await fetch(`${CATALOGS_ENDPOINT}/${catalogId}`, {
    method: "DELETE",
    credentials: "include",
  });

  await handleResponse(response);
}

export function userCatalogsKey(): string {
  return buildCatalogsUrl({ type: "user" });
}

export function catalogsFetcher(url: string): Promise<CatalogPreviewDto[]> {
  const typeParam = new URLSearchParams(url.split("?")[1] ?? "");
  const type = (typeParam.get("type") as CatalogType) ?? "user";
  return fetchCatalogs({ type });
}

export function catalogRoutesKey(catalogId: string, page: number, pageSize?: number): string {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  if (pageSize) {
    searchParams.set("page_size", String(pageSize));
  }

  const query = searchParams.toString();
  return `${CATALOGS_ENDPOINT}/${catalogId}/routes${query ? `?${query}` : ""}`;
}

export async function fetchCatalogRoutes(
  catalogId: string,
  page: number,
  pageSize?: number
): Promise<PaginatedResponse<RouteInCatalogDto>> {
  const url = catalogRoutesKey(catalogId, page, pageSize);
  return fetchCatalogRoutesFromUrl(url);
}

export async function fetchCatalogDetails(
  catalogId: string,
  params?: { routes_page?: number; routes_page_size?: number }
): Promise<CatalogDetailsDto> {
  const url = new URL(
    `${CATALOGS_ENDPOINT}/${catalogId}`,
    typeof window === "undefined" ? "http://localhost" : window.location.origin
  );

  if (params?.routes_page) {
    url.searchParams.set("routes_page", String(params.routes_page));
  }

  if (params?.routes_page_size) {
    url.searchParams.set("routes_page_size", String(params.routes_page_size));
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<CatalogDetailsDto>(response);
}

export function catalogRoutesFetcher(url: string): Promise<PaginatedResponse<RouteInCatalogDto>> {
  return fetchCatalogRoutesFromUrl(url);
}

async function fetchCatalogRoutesFromUrl(url: string): Promise<PaginatedResponse<RouteInCatalogDto>> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<PaginatedResponse<RouteInCatalogDto>>(response);
}
