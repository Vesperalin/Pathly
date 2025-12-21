"use server";

import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createLoginSchema, createRegisterSchema, type LoginFormValues, type RegisterFormValues } from "./validation";

// Error codes mapping for better UX
const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "invalid_credentials",
  EMAIL_NOT_CONFIRMED: "email_not_confirmed",
  TOO_MANY_REQUESTS: "over_email_send_rate_limit",
  WEAK_PASSWORD: "weak_password",
  EMAIL_EXISTS: "user_already_exists",
  NETWORK_ERROR: "network_request_failed",
} as const;

interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Maps Supabase AuthError to localized error message key
 */
function mapAuthError(error: unknown): string {
  if (!(error instanceof AuthError)) {
    // Network or unknown errors
    if (error instanceof Error && error.message.includes("fetch")) {
      return "networkError";
    }
    return "generic";
  }

  // Map specific Supabase error codes
  const message = error.message.toLowerCase();

  if (message.includes("invalid") || message.includes("credentials") || error.status === 400) {
    return "invalidCredentials";
  }

  if (message.includes("email not confirmed") || message.includes(AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED)) {
    return "emailNotConfirmed";
  }

  if (message.includes("rate limit") || message.includes(AUTH_ERROR_CODES.TOO_MANY_REQUESTS)) {
    return "tooManyRequests";
  }

  if (message.includes("user not found") || message.includes("not registered")) {
    return "userNotFound";
  }

  return "generic";
}

/**
 * Server Action for user login
 * Validates credentials, signs in with Supabase, and redirects to dashboard
 */
export async function loginAction(locale: string, values: LoginFormValues): Promise<ActionResult> {
  // Server-side validation
  const validationMessages = {
    email: {
      required: "Email is required.",
      invalid: "Enter a valid email address.",
    },
    password: {
      required: "Password is required.",
      minLength: "Use at least 8 characters.",
      weak: "Password must contain letters and numbers.",
    },
    confirmPassword: {
      required: "Please confirm your password.",
      mismatch: "Passwords must match.",
    },
  };

  const schema = createLoginSchema(validationMessages);
  const result = schema.safeParse(values);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return {
      success: false,
      fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "generic",
      };
    }

    // Success - redirect to dashboard with locale
    redirect(`/${locale}/dashboard`);
  } catch (error) {
    // Handle redirect or unexpected errors
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return {
      success: false,
      error: mapAuthError(error),
    };
  }
}

/**
 * Server Action for user registration
 * Creates new account, auto-logs in, and redirects to dashboard
 */
export async function registerAction(locale: string, values: RegisterFormValues): Promise<ActionResult> {
  // Server-side validation
  const validationMessages = {
    email: {
      required: "Email is required.",
      invalid: "Enter a valid email address.",
    },
    password: {
      required: "Password is required.",
      minLength: "Use at least 8 characters.",
      weak: "Password must contain letters and numbers.",
    },
    confirmPassword: {
      required: "Please confirm your password.",
      mismatch: "Passwords must match.",
    },
  };

  const schema = createRegisterSchema(validationMessages);
  const result = schema.safeParse(values);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return {
      success: false,
      fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        // Email confirmation disabled for MVP as per spec
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      // Map specific registration errors
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists")
      ) {
        return {
          success: false,
          error: "emailTaken",
        };
      }

      if (error.message.toLowerCase().includes("password")) {
        return {
          success: false,
          error: "weakPassword",
        };
      }

      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "generic",
      };
    }

    // Note: Profile creation and default catalogs are handled by database trigger
    // (after insert on auth.users) as per spec

    // Success - redirect to dashboard with locale
    redirect(`/${locale}/dashboard`);
  } catch (error) {
    // Handle redirect or unexpected errors
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return {
      success: false,
      error: mapAuthError(error),
    };
  }
}

/**
 * Server Action for user logout
 * Signs out and redirects to login page
 */
export async function logoutAction(locale: string): Promise<void> {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Log error but still redirect
    console.error("Logout error:", error);
  }

  redirect(`/${locale}/login`);
}
