import { loginAction, registerAction } from "@/features/auth/actions";
import type { LoginFormValues, RegisterFormValues } from "@/features/auth/validation";
import { AuthError } from "@supabase/supabase-js";
import { vi } from "vitest";

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const createClientMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

interface AuthStubOptions {
  signInResult?: {
    data: { user: { id: string; email: string } | null };
    error: AuthError | null;
  };
  signUpResult?: {
    data: { user: { id: string; email: string } | null };
    error: AuthError | null;
  };
}

function createAuthStub(options: AuthStubOptions = {}) {
  const defaultSuccess = {
    data: { user: { id: "user-1", email: "user@example.com" } },
    error: null,
  } as const;

  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(options.signInResult ?? defaultSuccess),
      signUp: vi.fn().mockResolvedValue(options.signUpResult ?? defaultSuccess),
    },
  };
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registration and login flow", () => {
    it("redirects to dashboard after successful login", async () => {
      const clientStub = createAuthStub();
      createClientMock.mockResolvedValueOnce(clientStub);
      const payload: LoginFormValues = {
        email: "user@example.com",
        password: "StrongPass1",
      };

      await loginAction("pl", payload);

      expect(clientStub.auth.signInWithPassword).toHaveBeenCalledWith({
        email: payload.email,
        password: payload.password,
      });
      expect(redirectMock).toHaveBeenCalledWith("/pl/dashboard");
    });

    it("returns invalidCredentials error for wrong password", async () => {
      const authError = new AuthError("Invalid credentials");
      (authError as AuthError).status = 400;
      const clientStub = createAuthStub({
        signInResult: {
          data: { user: null },
          error: authError,
        },
      });
      createClientMock.mockResolvedValueOnce(clientStub);

      const result = await loginAction("en", {
        email: "user@example.com",
        password: "WrongPass1",
      });

      expect(result).toEqual({
        success: false,
        error: "invalidCredentials",
      });
      expect(redirectMock).not.toHaveBeenCalled();
    });

    it("returns emailNotConfirmed error when Supabase reports unverified email", async () => {
      const authError = new AuthError("Email not confirmed");
      (authError as AuthError).status = 401;
      const clientStub = createAuthStub({
        signInResult: {
          data: { user: null },
          error: authError,
        },
      });
      createClientMock.mockResolvedValueOnce(clientStub);

      const result = await loginAction("pl", {
        email: "user@example.com",
        password: "StrongPass1",
      });

      expect(result).toEqual({
        success: false,
        error: "emailNotConfirmed",
      });
      expect(redirectMock).not.toHaveBeenCalled();
    });

    it("redirects after successful registration", async () => {
      const clientStub = createAuthStub({
        signUpResult: {
          data: { user: { id: "user-2", email: "new@example.com" } },
          error: null,
        },
      });
      createClientMock.mockResolvedValueOnce(clientStub);
      const payload: RegisterFormValues = {
        email: "new@example.com",
        password: "StrongPass1",
        confirmPassword: "StrongPass1",
      };

      await registerAction("en", payload);

      expect(clientStub.auth.signUp).toHaveBeenCalledWith({
        email: payload.email,
        password: payload.password,
        options: { emailRedirectTo: undefined },
      });
      expect(redirectMock).toHaveBeenCalledWith("/en/dashboard");
    });

    it("returns emailTaken when Supabase reports duplicate email", async () => {
      const authError = new AuthError("User already exists");
      const clientStub = createAuthStub({
        signUpResult: {
          data: { user: null },
          error: authError,
        },
      });
      createClientMock.mockResolvedValueOnce(clientStub);

      const result = await registerAction("pl", {
        email: "existing@example.com",
        password: "StrongPass1",
        confirmPassword: "StrongPass1",
      });

      expect(result).toEqual({
        success: false,
        error: "emailTaken",
      });
      expect(redirectMock).not.toHaveBeenCalled();
    });
  });
});
