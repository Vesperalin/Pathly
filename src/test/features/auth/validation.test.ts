import {
  createChangePasswordSchema,
  createRegisterSchema,
  type AuthValidationMessages,
  type ChangePasswordValidationMessages,
} from "@/features/auth/validation";

const authMessages: AuthValidationMessages = {
  email: {
    required: "Email required",
    invalid: "Email invalid",
  },
  password: {
    required: "Password required",
    minLength: "Password too short",
  },
  confirmPassword: {
    required: "Confirm password required",
    mismatch: "Passwords do not match",
  },
};

const changePasswordMessages: ChangePasswordValidationMessages = {
  currentPassword: { required: "Current password required" },
  newPassword: {
    required: "New password required",
    minLength: "New password too short",
  },
  confirmPassword: {
    required: "Confirm password required",
    mismatch: "Passwords do not match",
  },
};

describe("password change validation", () => {
  it("accepts a valid payload (current + new password)", () => {
    const schema = createChangePasswordSchema(changePasswordMessages);
    const payload = {
      currentPassword: "CurrentPass1",
      newPassword: "NewPass123",
      confirmPassword: "NewPass123",
    };

    expect(schema.parse(payload)).toEqual(payload);
  });

  it("rejects requests without current password", () => {
    const schema = createChangePasswordSchema(changePasswordMessages);
    const result = schema.safeParse({
      currentPassword: "",
      newPassword: "NewPass123",
      confirmPassword: "NewPass123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["currentPassword"],
        message: changePasswordMessages.currentPassword.required,
      });
    }
  });

  it("rejects mismatched confirmation for new password", () => {
    const schema = createChangePasswordSchema(changePasswordMessages);
    const result = schema.safeParse({
      currentPassword: "CurrentPass1",
      newPassword: "NewPass123",
      confirmPassword: "OtherPass123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["confirmPassword"],
        message: changePasswordMessages.confirmPassword.mismatch,
      });
    }
  });
});

describe("registration validation", () => {
  it("fails when confirmation does not match password", () => {
    const schema = createRegisterSchema(authMessages);
    const result = schema.safeParse({
      email: "user@example.com",
      password: "StrongPass1",
      confirmPassword: "AnotherPass1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["confirmPassword"],
        message: authMessages.confirmPassword.mismatch,
      });
    }
  });

  it("passes for valid registration payload", () => {
    const schema = createRegisterSchema(authMessages);
    const payload = {
      email: "user@example.com",
      password: "StrongPass1",
      confirmPassword: "StrongPass1",
    };

    expect(schema.parse(payload)).toEqual(payload);
  });
});
