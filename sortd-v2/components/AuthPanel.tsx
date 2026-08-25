"use client";

import { FormEvent, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthPanelProps = {
  onUserChange: (user: User | null) => void;
};

export default function AuthPanel({ onUserChange }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<User | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      setUser(nextUser);
      onUserChange(nextUser);
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onUserChange]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.session) {
          setMessage("Account created. You’re signed in.");
        } else {
          setMessage("Account created. Check your email to confirm it.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setUser(null);
    onUserChange(null);
    setEmail("");
    setPassword("");
  }

  if (checkingSession) {
    return (
      <div className="rounded-3xl bg-white/85 p-4 text-sm text-slate-500 shadow-xl backdrop-blur-md">
        Checking account…
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-3xl bg-white/85 p-4 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Signed in
        </p>

        <p className="mt-2 truncate text-sm font-medium text-slate-900">
          {user.email}
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 text-sm text-slate-500 underline-offset-4 hover:text-[#1f0825] hover:underline"
        >
          Log out
        </button>

        {message && <p className="mt-3 text-xs text-red-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {mode === "login" ? "Welcome back" : "Create account"}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block text-xs font-medium text-slate-600">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#cd6ce7]"
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#cd6ce7]"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#1f0825] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#cd6ce7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((current) => (current === "login" ? "signup" : "login"));

          setMessage("");
        }}
        className="mt-3 w-full text-sm text-slate-500 hover:text-[#1f0825]"
      >
        {mode === "login"
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>

      {message && <p className="mt-3 text-xs text-slate-600">{message}</p>}
    </div>
  );
}
