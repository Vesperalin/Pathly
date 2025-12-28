import { ThemeSwitcher } from "@/app/[locale]/(private)/settings/_components/ThemeSwitcher";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => (namespace ? `${namespace}.${key}` : key),
}));

describe("Theme switching behaviour", () => {
  it("triggers theme change and disables the active option", async () => {
    const onSelect = vi.fn();
    render(<ThemeSwitcher currentValue="light" onSelect={onSelect} />);
    const user = userEvent.setup();

    const lightButton = screen.getByRole("button", { name: "settings.personalization.theme.options.light" });
    const darkButton = screen.getByRole("button", { name: "settings.personalization.theme.options.dark" });

    expect(lightButton).toBeDisabled();
    await user.click(darkButton);

    expect(onSelect).toHaveBeenCalledWith("dark");
  });
});
