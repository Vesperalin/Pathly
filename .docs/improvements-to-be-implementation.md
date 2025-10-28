# Improvements to Be Implemented: API and Features Refactoring

This document outlines a step-by-step plan to implement the following approved improvements to the `@api/` and `@features/` modules in the Pathly project. These changes focus on centralizing logic, validations, error handling, type safety, and minor optimizations for better maintainability, consistency, and scalability.

**Approved Items**:

1. Centralize All Business Logic in `@features/` Services.
2. Centralize All Validations in `@features/*/validation.ts`.
3. Standardize Error Handling and Responses.
4. Improve Type Safety and DB Integration.
5. Minor Optimizations and Consistency.

**Non-Approved**: Authentication (item 3) is skipped; continue using `DEFAULT_USER_ID` placeholders.

**General Guidelines for Implementation**:

- Follow project coding practices: Use guard clauses/early returns for errors; handle edge cases upfront; avoid deep nesting; log errors with console in dev (no eslint disables).
- Use absolute imports (e.g., `@/features/catalogs/catalog.service`).
- Run `npm run lint` and `npm run type-check` after each major step.
- Do not introduce new dependencies.
- For DB changes: No migrations needed; focus on code.
- Test manually: Use Postman/Thunder Client for API endpoints; verify responses match expected DTOs.
- If issues arise (e.g., type errors), regenerate Supabase types: `npx supabase gen types typescript --project-id [your-project-id] > src/db/database.types.ts`.
- Commit incrementally (e.g., one item per commit) with messages like "refactor: centralize catalog service logic".

## 1. Centralize All Business Logic in `@features/` Services

**Goal**: Move direct Supabase queries from API routes to feature services. This makes API routes thinner, encapsulates DB logic, and ensures consistent ownership checks (using `DEFAULT_USER_ID`).

**Rationale**: Reduces duplication (e.g., fetch/update patterns repeated); services can be unit-tested independently.

**Files to Modify/Create**:

- Create: `src/features/catalogs/catalog.service.ts` (expand existing).
- Create: `src/features/profiles/profile.service.ts`.
- Create: `src/features/mountain-groups/mountain-groups.service.ts`.
- Update: All API route files (`src/app/api/catalogs/route.ts`, `src/app/api/catalogs/[catalogId]/route.ts`, `src/app/api/profiles/me/route.ts`, `src/app/api/mountain-groups/route.ts`).

**Detailed Steps**:

1. **Expand `src/features/catalogs/catalog.service.ts`**:
   - Add imports: `import type { CreateCatalogCommand, UpdateCatalogCommand, CatalogPreviewDto } from "@/types"; import { ConflictError, NotFoundError, ForbiddenError } from "@/lib/errors";`.
   - Add `createCatalog` function:

     ```typescript
     export async function createCatalog(
       supabase: SupabaseClient<Database>,
       command: CreateCatalogCommand,
       userId: string
     ): Promise<CatalogPreviewDto> {
       // Guard: Validate inputs (but assume validated upstream)
       if (!command.name || command.name.length > 255) {
         throw new ValidationError("Invalid catalog name");
       }

       const { data: newCatalog, error: dbError } = await supabase
         .schema("pathly")
         .from("catalogs")
         .insert({ name: command.name, user_id: userId, is_predefined: false })
         .select("id, name, is_predefined, created_at, updated_at")
         .single();

       if (dbError) {
         if (dbError.code === "23505") {
           // Unique violation
           throw new ConflictError(`Catalog "${command.name}" already exists`);
         }
         console.error("DB error creating catalog:", dbError);
         throw new Error("Failed to create catalog");
       }

       if (!newCatalog) {
         throw new NotFoundError("Catalog creation failed: No data returned");
       }

       return {
         id: newCatalog.id,
         name: newCatalog.name,
         is_predefined: newCatalog.is_predefined,
         total_points: 0,
         created_at: newCatalog.created_at,
         updated_at: newCatalog.updated_at,
       };
     }
     ```

   - Add `updateCatalog` (similar to create, but use `.update({ name })` and check ownership first):
     - Fetch catalog: `select("id, user_id, is_predefined, name") .eq("id", catalogId) .single()`.
     - Guards: If not found → `NotFoundError`; if `user_id !== userId` or `is_predefined` → `ForbiddenError`; unique violation → `ConflictError`.
     - Return updated `CatalogPreviewDto`.
   - Add `deleteCatalog`: Fetch to check ownership/predefined, then `.delete().eq("id", catalogId)`; return `void` on success.
   - Export types if needed (e.g., `type CreateCatalogCommand = { name: string; }`).

2. **Create `src/features/profiles/profile.service.ts`**:
   - Add imports: Similar to above, plus `type { ProfileDto, UpdateProfileCommand } from "@/types";`.
   - Add `getProfile`:

     ```typescript
     export async function getProfile(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileDto | null> {
       const { data: profile, error: dbError } = await supabase
         .schema("pathly")
         .from("profiles")
         .select("id, language, theme, created_at")
         .eq("id", userId)
         .single();

       if (dbError && dbError.code !== "PGRST116") {
         console.error("DB error fetching profile:", dbError);
         throw new Error("Failed to fetch profile");
       }

       if (!profile) return null;

       return {
         id: profile.id,
         language: profile.language,
         theme: profile.theme,
         created_at: profile.created_at,
       };
     }
     ```

   - Add `updateProfile`: Use `.update(validatedData).eq("id", userId).select(...)`; handle PGRST116 as `NotFoundError`; return `ProfileDto`.

3. **Create `src/features/mountain-groups/mountain-groups.service.ts`**:
   - Add imports: `type { MountainGroupDto } from "@/types";`.
   - Add `getAllMountainGroups`:

     ```typescript
     export async function getAllMountainGroups(supabase: SupabaseClient<Database>): Promise<MountainGroupDto[]> {
       const { data: groups, error: dbError } = await supabase
         .schema("pathly")
         .from("mountain_groups")
         .select("*")
         .order("name", { ascending: true });

       if (dbError) {
         console.error("DB error fetching mountain groups:", dbError);
         throw new Error("Failed to fetch mountain groups");
       }

       return groups as MountainGroupDto[];
     }
     ```

     - No userId needed (public data).

4. **Update API Routes**:
   - In `src/app/api/catalogs/route.ts` (POST): Replace direct insert with `const newCatalog = await createCatalog(supabase, validatedData, DEFAULT_USER_ID); return NextResponse.json(newCatalog, { status: 201 });`.
   - In `src/app/api/catalogs/[catalogId]/route.ts` (GET/PATCH/DELETE): Use `getCatalogDetails` (existing), but add `updateCatalog`/`deleteCatalog` calls; pass `DEFAULT_USER_ID`.
   - In `src/app/api/profiles/me/route.ts` (GET/PATCH): Use `getProfile`/`updateProfile`.
   - In `src/app/api/mountain-groups/route.ts` (GET): Use `getAllMountainGroups(supabase)`.
   - Remove direct queries; keep validation/parsing.

**Verification**:

- Test endpoints: POST /api/catalogs (create succeeds, duplicate → 409); GET /api/profiles/me (returns DTO or 404).
- Check console for errors; ensure no direct Supabase calls left in routes.

**Dependencies**: Item 2 (validations); update `src/types.ts` if new command types needed.

## 2. Centralize All Validations in `@features/*/validation.ts`

**Goal**: Move all Zod schemas from API routes to feature validation files for reuse and consistency.

**Rationale**: Prevents duplication (e.g., UUID validation repeated); single place for rules like name length.

**Files to Modify/Create**:

- Update: `src/features/catalogs/validation.ts` (add schemas).
- Update: `src/features/routes/validation.ts` (add Create schema).
- Create: `src/features/profiles/validation.ts`.
- Update: All API route files (import and use schemas).

**Detailed Steps**:

1. **Update `src/features/catalogs/validation.ts`**:
   - Add:

     ```typescript
     export const CreateCatalogCommandSchema = z.object({
       name: z.string().min(1, "Name is required.").max(255, "Name must not exceed 255 characters."),
     });
     export type CreateCatalogCommand = z.infer<typeof CreateCatalogCommandSchema>;

     export const UpdateCatalogCommandSchema = z.object({
       name: z.string().min(1, "Name is required.").max(255, "Name must not exceed 255 characters."),
     });
     export type UpdateCatalogCommand = z.infer<typeof UpdateCatalogCommandSchema>;

     export const CatalogIdParamSchema = z.object({
       catalogId: z.string().uuid("Invalid catalog ID."),
     });
     ```

   - Keep existing `GetCatalogsQuerySchema` etc.

2. **Update `src/features/routes/validation.ts`**:
   - Add `CreateRouteCommandSchema` (move from `api/routes/route.ts`):
     ```typescript
     export const CreateRouteCommandSchema = z.object({
       name: z.string().min(1, "Route name is required").max(255, "..."),
       route_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "..."),
       // ... (all fields as in original inline schema)
     });
     export type CreateRouteCommand = z.infer<typeof CreateRouteCommandSchema>;
     ```
   - Keep `GetRoutesQuerySchema`, `UpdateRouteCommandSchema`, `RouteIdParamSchema`.

3. **Create `src/features/profiles/validation.ts`**:
   - Add:
     ```typescript
     export const UpdateProfileCommandSchema = z
       .object({
         language: z.enum(["pl", "en"]).optional(),
         theme: z.enum(["light", "dark", "system"]).optional(),
       })
       .strict()
       .refine((data) => Object.keys(data).length > 0, { message: "At least one field required" });
     export type UpdateProfileCommand = z.infer<typeof UpdateProfileCommandSchema>;
     ```

4. **Update API Routes**:
   - E.g., in `api/catalogs/route.ts` (POST): `import { CreateCatalogCommandSchema } from "@/features/catalogs/validation"; const validationResult = CreateCatalogCommandSchema.safeParse(requestBody);`.
   - For params (e.g., `[catalogId]`): `const paramsValidation = CatalogIdParamSchema.safeParse(await context.params); if (!paramsValidation.success) { return NextResponse.json({ error: "...", details: paramsValidation.error.flatten().fieldErrors }, { status: 400 }); }`.
   - Remove inline schemas; import and use.

**Verification**:

- Test validation: Invalid POST body → 400 with `details`; valid → proceeds to service.
- Ensure no Zod errors at runtime.

**Dependencies**: None (do after item 1 for full integration).

## 4. Standardize Error Handling and Responses

**Goal**: Use custom errors everywhere; add a helper for consistent JSON responses and logging.

**Rationale**: Uniform error format (e.g., `{ error: string, message?: string, details?: any }`); better debugging.

**Files to Modify/Create**:

- Create: `src/lib/api.ts` (new helper).
- Update: All API route files (use helper and custom errors).
- Update: Services (throw custom errors).

**Detailed Steps**:

1. **Create `src/lib/api.ts`**:

   ```typescript
   import { NextResponse } from "next/server";

   export function handleApiError(error: unknown, defaultStatus = 500): NextResponse {
     let status = defaultStatus;
     let body = { error: "An unexpected server error occurred." };

     if (error instanceof ValidationError) {
       status = 400;
       body = { error: "Validation failed.", details: error.details || error.message };
     } else if (error instanceof NotFoundError) {
       status = 404;
       body = { error: "Not found.", message: error.message };
     } else if (error instanceof ForbiddenError) {
       status = 403;
       body = { error: "Forbidden.", message: error.message };
     } else if (error instanceof ConflictError) {
       status = 409;
       body = { error: "Conflict.", message: error.message };
     } else if (error instanceof Error) {
       body.message = error.message;
       console.error("API Error:", error); // Dev logging
     }

     return NextResponse.json(body, { status });
   }
   ```

2. **Update Services**:
   - In all new/existing functions (e.g., `createCatalog`): Throw custom errors (e.g., `throw new ValidationError("Invalid name", { issues: [...] });` for Zod in services if needed).
   - For DB errors: Map codes (e.g., "23505" → `ConflictError`).

3. **Update API Routes**:
   - Wrap try/catch: `} catch (error) { return handleApiError(error); }`.
   - For validation: `if (!success) { throw new ValidationError("Invalid params", { issues: validationResult.error.issues }); }`.
   - Remove manual `NextResponse.json({ error: ... })`; use helper.
   - Standardize success: Always `{ status: 200/201 }`; no extra fields unless DTO.

**Verification**:

- Test errors: Invalid UUID → 400 with details; duplicate → 409; DB fail → 500.
- Check logs: Errors logged, user sees friendly messages.

**Dependencies**: Item 1 (services throw errors); `lib/errors.ts` (ensure all custom errors exported).

## 5. Improve Type Safety and DB Integration

**Goal**: Eliminate `any`/`unknown as` casts; update Supabase types.

**Rationale**: Compile-time safety; accurate DTO mapping.

**Files to Modify/Create**:

- Update: `src/db/database.types.ts` (regen).
- Update: Services (e.g., `catalog.service.ts`, `route.service.ts` for RPC/nested).
- Update: `src/db/types.ts` (add RPC interfaces if needed).

**Detailed Steps**:

1. **Regenerate Types**:
   - Run: `npx supabase gen types typescript --project-id [your-project-id] > src/db/database.types.ts`.
   - If RPC types missing, add manual interfaces in `src/db/types.ts`:
     ```typescript
     export interface GetUserCatalogsResult {
       id: string;
       name: string;
       // ... (match RPC output)
       total_count: number;
     }
     export interface CatalogDetailsRpcResult extends CatalogDetailsDto {} // For JSON cast
     ```

2. **Update Services**:
   - For RPC (e.g., `getCatalogs`): `const { data } = await supabase.schema("pathly").rpc("get_user_catalogs", params) as GetUserCatalogsResult[];`.
   - For nested (e.g., `getRouteDetails`): Use typed selects; remove `as unknown as`; define interfaces like `RouteWithAssociations` extending `RouteDetailsDto`.
   - In `createRoute`/`updateRoute`: Cast RPC return: `data as RouteDetailsDto` (safe after regen).
   - Add JSDoc: `@returns {Promise<CatalogDetailsDto | null>}`.

3. **Update API Routes**:
   - Ensure params/query: `z.infer` types match service params.

**Verification**:

- Run `npm run type-check`: No errors.
- Test: API returns typed DTOs (e.g., JSON matches interfaces).

**Dependencies**: Run after migrations if any; item 1.

## 6. Minor Optimizations and Consistency

**Goal**: Clean up small issues for polish.

**Rationale**: Improves readability/performance without major changes.

**Files to Modify/Create**:

- Update: `src/types.ts` (add shared types).
- Update: `src/app/api/routes/gpx-parse/route.ts` (add limits).
- Update: All services/API (remove eslint disables; use utils).

**Detailed Steps**:

1. **Add Shared Types in `src/types.ts`**:

   ```typescript
   export interface PaginationParams {
     page: number;
     page_size: number;
     total: number;
   }
   // Use in Paginated* DTOs
   ```

2. **GPX Endpoint**:
   - In `POST /api/routes/gpx-parse`: Add file size check:
     ```typescript
     if (fileObj.size > 10 * 1024 * 1024) {
       // 10MB
       return NextResponse.json({ error: "File too large (>10MB)" }, { status: 400 });
     }
     ```

3. **General Cleanup**:
   - Remove all `// eslint-disable-next-line no-console`; replace with `console.error` only in dev: `if (process.env.NODE_ENV === "development") console.error(...)`.
   - Ensure imports: Use `cn` from `lib/utils.ts` if UI-related (though not here).
   - Add tests skeleton in `src/test/` (optional): E.g., `catalog.service.test.ts` with Vitest mocks for Supabase.
   - Pagination: Use `PaginationParams` in queries.

**Verification**:

- Lint passes; no console disables.
- GPX test: Large file → 400.
- Overall: Run full API tests; check for consistency (e.g., all responses use helper).

**Dependencies**: All prior items.

## Next Steps After Implementation

- Full test suite: Cover 80% of services with units (mock Supabase).
- Review: Run code review for types/errors.
- Deploy: Test in staging; monitor for regressions.
- Update this doc: Mark sections as "Implemented" with dates.

Last Updated: [Insert Date]
