"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginType = "staff" | "platform";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
        setError(payload?.error ?? "Login failed.");
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
      setError("Backend unreachable. Start `npm run dev:backend` then try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">MyStay Admin</p>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          {loginType === "platform" 
            ? "Platform admin access to manage hotels and system settings."
            : "Hotel staff access to manage your hotel's operations."}
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
          Hotel Staff
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
          Platform Admin
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {loginType === "platform" ? "Platform Admin Login" : "Hotel Staff Login"}
          </CardTitle>
          <CardDescription>
            {loginType === "platform" 
              ? "Access hotel management and system configuration."
              : "Demo user is prefilled for local development."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              {isLoading ? "Signing in…" : "Sign in"}
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
          Loading…
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
