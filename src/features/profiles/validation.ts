import { z } from "zod";

/**
 * Validation schema for updating a user's profile.
 * Validates the UpdateProfileCommand type.
 * At least one field must be provided for update.
 */
export const UpdateProfileCommandSchema = z
  .object({
    language: z.enum(["pl", "en"]).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateProfileCommand = z.infer<typeof UpdateProfileCommandSchema>;
