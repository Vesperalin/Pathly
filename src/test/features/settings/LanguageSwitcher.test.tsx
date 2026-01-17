import { LanguageSwitcher } from "@/app/[locale]/(private)/settings/_components/LanguageSwitcher";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => (namespace ? `${namespace}.${key}` : key),
}));

describe("language switching behaviour", () => {
  it("disables the active language and triggers selection for another one", async () => {
    const onSelect = vi.fn();
    render(<LanguageSwitcher currentValue="pl" onSelect={onSelect} />);
    const user = userEvent.setup();

    const polishButton = screen.getByRole("button", { name: "settings.personalization.language.options.pl" });
    const englishButton = screen.getByRole("button", { name: "settings.personalization.language.options.en" });

    expect(polishButton).toBeDisabled();
    await user.click(englishButton);

    expect(onSelect).toHaveBeenCalledWith("en");
  });

  it("prevents interactions when component is disabled", async () => {
    const onSelect = vi.fn();
    render(<LanguageSwitcher currentValue="en" onSelect={onSelect} disabled />);
    const user = userEvent.setup();

    const polishButton = screen.getByRole("button", { name: "settings.personalization.language.options.pl" });

    expect(polishButton).toBeDisabled();
    await user.click(polishButton);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
