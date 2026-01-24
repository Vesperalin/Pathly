import { z } from "zod";

export interface EmailValidationMessages {
  required: string;
  invalid: string;
}

export interface PasswordValidationMessages {
  required: string;
  minLength: string;
}

export interface ConfirmPasswordValidationMessages {
  required: string;
  mismatch: string;
}

export interface AuthValidationMessages {
  email: EmailValidationMessages;
  password: PasswordValidationMessages;
  confirmPassword: ConfirmPasswordValidationMessages;
}

export interface ChangePasswordValidationMessages {
  currentPassword: {
    required: string;
  };
  newPassword: PasswordValidationMessages;
  confirmPassword: ConfirmPasswordValidationMessages;
}

const createEmailSchema = (messages: EmailValidationMessages) =>
  z.string().trim().min(1, { message: messages.required }).email({ message: messages.invalid });

const createPasswordSchema = (messages: PasswordValidationMessages) =>
  z.string().min(1, { message: messages.required }).min(8, { message: messages.minLength });

const createConfirmPasswordSchema = (messages: ConfirmPasswordValidationMessages) =>
  z.string().min(1, { message: messages.required });

function withPasswordConfirmation<T extends { password: string; confirmPassword: string }>(
  schema: z.ZodType<T>,
  mismatchMessage: string
) {
  return schema.superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: mismatchMessage,
      });
    }
  });
}

export function createLoginSchema(messages: AuthValidationMessages) {
  return z.object({
    email: createEmailSchema(messages.email),
    password: createPasswordSchema(messages.password),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema(messages: AuthValidationMessages) {
  return withPasswordConfirmation(
    createLoginSchema(messages).extend({
      confirmPassword: createConfirmPasswordSchema(messages.confirmPassword),
    }),
    messages.confirmPassword.mismatch
  );
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function createChangePasswordSchema(messages: ChangePasswordValidationMessages) {
  return z
    .object({
      currentPassword: z.string().min(1, { message: messages.currentPassword.required }),
      newPassword: createPasswordSchema(messages.newPassword),
      confirmPassword: createConfirmPasswordSchema(messages.confirmPassword),
    })
    .superRefine((values, ctx) => {
      if (values.newPassword !== values.confirmPassword) {
        ctx.addIssue({
          path: ["confirmPassword"],
          code: z.ZodIssueCode.custom,
          message: messages.confirmPassword.mismatch,
        });
      }
    });
}

export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;
