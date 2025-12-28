import { AuthCard } from "@/features/auth/components/AuthCard";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { loginAction } from "@/features/auth/actions";
import { getTranslations } from "next-intl/server";

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });

  // Bind locale to loginAction
  const loginWithLocale = loginAction.bind(null, locale);

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <LoginForm onSubmit={loginWithLocale} />
    </AuthCard>
  );
}
