import { AuthCard } from "@/features/auth/components/AuthCard";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getTranslations } from "next-intl/server";

interface RegisterPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <RegisterForm />
    </AuthCard>
  );
}
