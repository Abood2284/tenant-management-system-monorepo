"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { Particles } from "@/components/magicui/particles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(`${workerUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseData = (await response.json()) as {
        message: string;
        data: {
          session: string;
        };
      };

      if (!response.ok) {
        throw new Error(responseData.message || "Login failed");
      }

      // Assuming the response data contains a session object
      localStorage.setItem("session", JSON.stringify(responseData.data));
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-papaya-whip-500 overflow-hidden">
      <Particles
        className="absolute inset-0 z-0"
        quantity={150}
        ease={80}
        color={"#003049"}
        refresh
      />
      <Card className="w-full max-w-md z-10 bg-papaya-whip-500/80 backdrop-blur-sm border-prussian-blue-500/20 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-prussian-blue-500">
            Admin Login
          </CardTitle>
          <CardDescription className="text-prussian-blue-400">
            Please sign in to manage your properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-prussian-blue-500">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={isLoading}
                className={inputStyles}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-prussian-blue-500">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
                className={inputStyles}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-fire-brick-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-fire-brick-600">
                  Login Failed
                </AlertTitle>
                <AlertDescription className="text-fire-brick-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full font-semibold text-papaya-whip-500 bg-prussian-blue-500 hover:bg-prussian-blue-600"
              disabled={isLoading}
              aria-disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

// Static Content
const inputStyles =
  "bg-papaya-whip-500 text-prussian-blue-500 border-prussian-blue-200 placeholder:text-prussian-blue-400/70 focus-visible:ring-prussian-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
