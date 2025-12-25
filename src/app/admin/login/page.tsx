"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@/components/ui";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center p-4 pattern-overlay">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7E7CE]/50 via-transparent to-[#F7E7CE]/30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Decorative top ornament */}
        <div className="flex justify-center mb-8">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-[#C9A227]">
            <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="1" opacity="0.2" />
            <path d="M30 10L32 20L40 18L34 26L42 30L34 34L40 42L32 40L30 50L28 40L20 42L26 34L18 30L26 26L20 18L28 20L30 10Z" fill="currentColor" opacity="0.4" />
          </svg>
        </div>

        <div className="wedding-card rounded-2xl p-8 relative">
          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#C9A227]/30 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#C9A227]/30 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#C9A227]/30 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#C9A227]/30 rounded-br-lg" />

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7E7CE] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1
              className="text-3xl font-semibold text-[#3D3D3D] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Admin Portal
            </h1>
            <p className="text-[#6B6B6B] font-light">
              Enter your credentials to manage the event
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-[#FFFEF7] border border-[#E8D5A3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227] transition-all placeholder:text-[#6B6B6B]/50"
              />
              {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-[#C9A227] hover:bg-[#B8922A] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#C9A227]/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8D5A3] to-transparent" />
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#C9A227] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Guest View
            </Link>
          </div>
        </div>

        {/* Bottom decorative text */}
        <p className="text-center mt-6 text-xs text-[#6B6B6B]/50">
          Wedding Seat Management System
        </p>
      </div>
    </div>
  );
}
