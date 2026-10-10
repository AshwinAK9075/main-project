"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TreePine, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const fillQuickAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="container max-w-lg mx-auto py-16 px-4">
      <Card className="shadow-lg border-emerald-100">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-2">
            <TreePine className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Sign In to MRV Portal</CardTitle>
          <CardDescription>
            Enter your credentials or choose a pre-seeded viva role
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Viva Role Selector */}
          <div className="p-3.5 bg-muted/40 rounded-lg border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>1-Click Seeded Demo Logins:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillQuickAccount("landowner1@forestcarbon.io")}
                className="text-xs justify-start h-8"
              >
                🌾 Landowner (Liam)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillQuickAccount("verifier@forestcarbon.io")}
                className="text-xs justify-start h-8"
              >
                🔍 Verifier (Victor)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillQuickAccount("buyer1@forestcarbon.io")}
                className="text-xs justify-start h-8"
              >
                🛒 Buyer (Bob)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillQuickAccount("admin@forestcarbon.io")}
                className="text-xs justify-start h-8"
              >
                ⚙️ Admin (Alice)
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@forestcarbon.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="ml-1 font-semibold text-emerald-700 hover:underline">
            Register here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container max-w-lg mx-auto py-16 text-center text-xs text-muted-foreground">Loading login portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
