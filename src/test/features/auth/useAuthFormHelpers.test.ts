import { useLocaleAwarePath } from "@/features/auth/components/useAuthFormHelpers";
import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

const useParamsMock = vi.fn((): { locale?: string } => ({ locale: "pl" }));
vi.mock("next/navigation", () => ({
  useParams: () => useParamsMock(),
}));

describe("language switch path handling", () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ locale: "pl" });
  });

  it("prefixes the path with the current locale", () => {
    const { result } = renderHook(() => useLocaleAwarePath());
    expect(result.current("/dashboard")).toBe("/pl/dashboard");
  });

  it("returns the path unchanged when locale is missing", () => {
    useParamsMock.mockReturnValue({});
    const { result } = renderHook(() => useLocaleAwarePath());
    expect(result.current("/login")).toBe("/login");
  });
});
