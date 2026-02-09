"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/landing/Header";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/account");
    });
  }, [router, supabase.auth]);

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />

      {/* Sign-in card */}
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/60 bg-white/70 p-10 shadow-glass backdrop-blur-xl md:p-12">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-semibold text-stone-850 md:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-stone-600">
                Sign in with Google to shop, track orders, and manage your
                account.
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              data-testid="sign-in-google"
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-stone-300 bg-white py-4 font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 active:scale-[0.99]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="mt-6 text-center text-sm text-stone-500">
              We use Google only—no passwords to remember.
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-stone-500">
            By signing in, you agree to our terms and privacy policy.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
