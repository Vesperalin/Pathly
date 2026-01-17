/**
 * Lekki helper mockujący SupabaseClient.
 * Pozwala testom usług definiować tylko oczekiwane odpowiedzi (insert/select/update/delete/RPC),
 * bez powtarzania boilerplate’u i bez prawdziwego połączenia z bazą.
 */

import type { Database } from "@/db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type TableSingleResult<T> = Promise<{
  data: T | null;
  error: { message?: string; code?: string } | null;
}>;

type DeleteResult = Promise<{ error: { message?: string; code?: string } | null }>;

interface TableHandlers<T = unknown> {
  onInsert?: () => TableSingleResult<T>;
  onSelect?: () => TableSingleResult<T>;
  onUpdate?: () => TableSingleResult<T>;
  onDelete?: (column: string, value: unknown) => DeleteResult;
}

interface SupabaseMockConfig {
  rpc?: (
    fn: string,
    params?: unknown
  ) => Promise<{
    data: unknown;
    error: { message: string; details?: string; hint?: string; code?: string } | null;
  }>;
  tables?: Record<string, TableHandlers>;
}

const defaultSingle = async () => ({ data: null, error: null });
const defaultDelete = async () => ({ error: null });
const defaultRpc = async () => ({ data: null, error: null });

export function createSupabaseClientMock(config: SupabaseMockConfig): SupabaseClient<Database> {
  const schemaMock = () => ({
    rpc: config.rpc ?? defaultRpc,
    from(table: string) {
      const handlers = config.tables?.[table];
      if (!handlers) {
        throw new Error(`No handlers configured for table "${table}".`);
      }

      return {
        insert() {
          return {
            select() {
              return {
                single: handlers.onInsert ?? defaultSingle,
              };
            },
          };
        },
        select() {
          const chain = {
            eq() {
              return chain;
            },
            single: handlers.onSelect ?? defaultSingle,
          };
          return chain;
        },
        update() {
          return {
            eq() {
              return {
                select() {
                  return {
                    single: handlers.onUpdate ?? defaultSingle,
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(column: string, value: unknown) {
              const handler = handlers.onDelete ?? defaultDelete;
              return handler(column, value);
            },
          };
        },
      };
    },
  });

  return {
    schema: schemaMock,
  } as unknown as SupabaseClient<Database>;
}
