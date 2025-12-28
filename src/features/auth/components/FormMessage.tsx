import type { ReactNode } from "react";

interface FieldErrorProps {
  id: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

interface FormErrorMessageProps {
  message?: string | null;
  icon?: ReactNode;
}

export function FormErrorMessage({ message, icon }: FormErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>{message}</span>
    </div>
  );
}
