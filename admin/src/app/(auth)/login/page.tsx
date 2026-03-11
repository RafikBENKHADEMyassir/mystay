"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AdminLocale } from "@/lib/admin-locale";
import { defaultAdminLocale, getAdminLocaleFromPathname } from "@/lib/admin-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginType = "staff" | "platform";

const loginCopy: Record<
  AdminLocale,
  {
    appName: string;
    signIn: string;
    loading: string;
    hotelStaff: string;
    platformAdmin: string;
    staffLoginTitle: string;
    platformLoginTitle: string;
    staffAccessDescription: string;
    platformAccessDescription: string;
    platformLoginDescription: string;
    staffLoginDescription: string;
    email: string;
    password: string;
    signingIn: string;
    loginFailed: string;
    backendUnreachable: string;
  }
> = {
  en: {
    appName: "MyStay Admin",
    signIn: "Sign in",
    loading: "Loading...",
    hotelStaff: "Hotel Staff",
    platformAdmin: "Platform Admin",
    staffLoginTitle: "Hotel Staff Login",
    platformLoginTitle: "Platform Admin Login",
    staffAccessDescription: "Hotel staff access to manage your hotel's operations.",
    platformAccessDescription: "Platform admin access to manage hotels and system settings.",
    platformLoginDescription: "Access hotel management and system configuration.",
    staffLoginDescription: "Demo user is prefilled for local development.",
    email: "Email",
    password: "Password",
    signingIn: "Signing in...",
    loginFailed: "Login failed.",
    backendUnreachable: "Backend unreachable. Start `npm run dev:backend` then try again.",
  },
  fr: {
    appName: "MyStay Admin",
    signIn: "Se connecter",
    loading: "Chargement...",
    hotelStaff: "Personnel hotel",
    platformAdmin: "Admin plateforme",
    staffLoginTitle: "Connexion personnel hotel",
    platformLoginTitle: "Connexion admin plateforme",
    staffAccessDescription: "Acces personnel hotel pour gerer les operations de votre hotel.",
    platformAccessDescription: "Acces admin plateforme pour gerer les hotels et la configuration systeme.",
    platformLoginDescription: "Acces a la gestion hoteliere et a la configuration systeme.",
    staffLoginDescription: "Un compte demo est pre-rempli pour le developpement local.",
    email: "Email",
    password: "Mot de passe",
    signingIn: "Connexion...",
    loginFailed: "Echec de connexion.",
    backendUnreachable: "Backend inaccessible. Lancez `npm run dev:backend` puis reessayez.",
  },
  es: {
    appName: "MyStay Admin",
    signIn: "Iniciar sesion",
    loading: "Cargando...",
    hotelStaff: "Personal del hotel",
    platformAdmin: "Admin de plataforma",
    staffLoginTitle: "Inicio de sesion del personal",
    platformLoginTitle: "Inicio de sesion admin",
    staffAccessDescription: "Acceso del personal para gestionar las operaciones del hotel.",
    platformAccessDescription: "Acceso admin de plataforma para gestionar hoteles y configuracion del sistema.",
    platformLoginDescription: "Acceso a la gestion de hoteles y configuracion del sistema.",
    staffLoginDescription: "Usuario demo prellenado para desarrollo local.",
    email: "Correo",
    password: "Contrasena",
    signingIn: "Iniciando sesion...",
    loginFailed: "Error de inicio de sesion.",
    backendUnreachable: "Backend inaccesible. Inicia `npm run dev:backend` y vuelve a intentar.",
  },
};

function LoginPageInner() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const locale = getAdminLocaleFromPathname(pathname) ?? defaultAdminLocale;
  const t = loginCopy[locale];
  const typeParam = searchParams?.get("type");
  const initialType: LoginType = typeParam === "platform" ? "platform" : "staff";

  const [loginType, setLoginType] = useState<LoginType>(initialType);
  const [email, setEmail] = useState(loginType === "platform" ? "admin@mystay.com" : "manager@fourseasons.demo");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(type: LoginType) {
    setLoginType(type);
    setError(null);
    // Update default email based on type
    if (type === "platform") {
      setEmail("admin@mystay.com");
    } else {
      setEmail("manager@fourseasons.demo");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, loginType })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? t.loginFailed);
        return;
      }

      // Redirect based on login type
      if (loginType === "platform") {
        router.push("/platform");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError(t.backendUnreachable);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{t.appName}</p>
        <h1 className="text-2xl font-semibold">{t.signIn}</h1>
        <p className="text-sm text-muted-foreground">
          {loginType === "platform" ? t.platformAccessDescription : t.staffAccessDescription}
        </p>
      </header>

      {/* Login Type Toggle */}
      <div className="flex gap-2 rounded-lg border p-1">
        <button
          type="button"
          onClick={() => handleTypeChange("staff")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            loginType === "staff"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t.hotelStaff}
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("platform")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            loginType === "platform"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t.platformAdmin}
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {loginType === "platform" ? t.platformLoginTitle : t.staffLoginTitle}
          </CardTitle>
          <CardDescription>
            {loginType === "platform" ? t.platformLoginDescription : t.staffLoginDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t.signingIn : t.signIn}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* <p className="text-sm text-muted-foreground">
        <Button variant="link" className="h-auto p-0 text-primary" asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </p> */}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-10 text-sm text-muted-foreground">
          {loginCopy.en.loading}
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
