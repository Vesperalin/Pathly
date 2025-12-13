import { AuthCard } from "@/features/auth/components/AuthCard";
import { PasswordResetRequestForm } from "@/features/auth/components/PasswordResetRequestForm";
import { getTranslations } from "next-intl/server";

interface ForgotPasswordPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.resetRequest" });

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <PasswordResetRequestForm />
    </AuthCard>
  );
}
