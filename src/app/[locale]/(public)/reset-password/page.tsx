import { AuthCard } from "@/features/auth/components/AuthCard";
import { PasswordResetForm } from "@/features/auth/components/PasswordResetForm";
import { getTranslations } from "next-intl/server";

interface ResetPasswordPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.reset" });

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <PasswordResetForm />
    </AuthCard>
  );
}
