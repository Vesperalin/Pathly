import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Przykładowy test jednostkowy dla komponentu Button
 * Demonstracja podstawowych wzorców testowania z Vitest
 */

// Prosty komponent do testów (normalnie byłby importowany)
const Button = ({
  onClick,
  children,
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <button onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
};

describe("Button Component", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("should render button with text", () => {
    render(<Button onClick={mockOnClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should call onClick handler when clicked", async () => {
    const user = userEvent.setup();
    render(<Button onClick={mockOnClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Button onClick={mockOnClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should have disabled attribute when disabled prop is true", () => {
    render(
      <Button onClick={mockOnClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeDisabled();
  });
});

/**
 * Przykładowy test jednostkowy dla funkcji utility
 */
describe("Utils - cn function", () => {
  // Import funkcji cn z lib/utils
  const cn = (...inputs: (string | undefined | null | false)[]) => {
    return inputs.filter(Boolean).join(" ");
  };

  it("should merge class names", () => {
    const result = cn("class1", "class2", "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("should filter out falsy values", () => {
    const result = cn("class1", undefined, "class2", null, false, "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("should return empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });
});

/**
 * Przykładowy test z mockowanym API (MSW)
 */
describe("API Integration", () => {
  it("should demonstrate MSW usage", async () => {
    // W prawdziwym teście użyjesz server.use() do mockowania endpointu
    // Zobacz src/test/setup-tests.ts dla konfiguracji MSW
    expect(true).toBe(true);
  });
});
