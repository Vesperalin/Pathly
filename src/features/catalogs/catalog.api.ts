import type { CatalogPreviewDto, CreateCatalogCommand, PaginatedCatalogsDto, UpdateCatalogCommand } from "@/types";

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
