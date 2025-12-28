import { AuthCard } from "@/features/auth/components/AuthCard";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { registerAction } from "@/features/auth/actions";
import { getTranslations } from "next-intl/server";

interface RegisterPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });

  // Bind locale to registerAction
  const registerWithLocale = registerAction.bind(null, locale);

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <RegisterForm onSubmit={registerWithLocale} />
    </AuthCard>
  );
}
