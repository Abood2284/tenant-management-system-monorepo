"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Particles } from "@/components/magicui/particles";

interface LoginSuccessResponse {
  status: number;
  data: {
    sessionToken: string;
    user: Record<string, unknown>;
  };
}

interface LoginErrorResponse {
  message: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:8787/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData: LoginErrorResponse = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const json: LoginSuccessResponse = await response.json();
      const sessionData = json.data;
      localStorage.setItem("session", JSON.stringify(sessionData));
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen ">
      <div className="w-full max-w-md p-8 space-y-8 bg-papaya-whip-200 rounded-2xl shadow-lg border border-prussian-blue-100">
        <Particles
          className="absolute inset-0 z-0"
          quantity={100}
          ease={80}
          color={"#003049"}
          refresh
        />
        <div className="space-y-2">
          <ShineBorder />
          <h1 className="text-3xl font-bold text-center text-prussian-blue-500">
            Login
          </h1>
          <p className="text-center text-lg text-prussian-blue-400">
            Sign in to your admin dashboard
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-prussian-blue-500"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 mt-1 border border-prussian-blue-200 rounded-md shadow-sm bg-papaya-whip-500 text-prussian-blue-500 placeholder:text-prussian-blue-400 focus:outline-none focus:ring-2 focus:ring-prussian-blue-500 focus:border-prussian-blue-500 transition"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-prussian-blue-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 mt-1 border border-prussian-blue-200 rounded-md shadow-sm bg-papaya-whip-500 text-prussian-blue-500 placeholder:text-prussian-blue-400 focus:outline-none focus:ring-2 focus:ring-prussian-blue-500 focus:border-prussian-blue-500 transition"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-center text-fire-brick-500 font-medium">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 font-semibold text-papaya-whip-500 bg-prussian-blue-500 rounded-md shadow-sm hover:bg-prussian-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prussian-blue-500 transition"
            aria-label="Login"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
