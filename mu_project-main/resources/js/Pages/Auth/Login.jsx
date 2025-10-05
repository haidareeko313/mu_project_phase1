import React, { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import GuestLayout from "@/Layouts/GuestLayout";

export default function Login({ status = "", canResetPassword = true }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    return () => {
      reset("password");
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    // No Ziggy here — just post to the path
    post("/login");
  };

  return (
    <GuestLayout>
      <Head title="Log in" />

      {status && (
        <div className="mb-4 rounded border border-emerald-700 bg-emerald-900/30 px-3 py-2 text-emerald-200">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setData("email", e.target.value)}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
            autoComplete="username"
          />
          {errors.email && <div className="mt-1 text-sm text-red-400">{errors.email}</div>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-slate-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData("password", e.target.value)}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
            autoComplete="current-password"
          />
          {errors.password && <div className="mt-1 text-sm text-red-400">{errors.password}</div>}
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={data.remember}
              onChange={(e) => setData("remember", e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-0"
            />
            Remember me
          </label>

          {canResetPassword && (
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Forgot your password?
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={processing}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Log in
          </button>

          {/* If you keep registration enabled */}
          <Link href="/register" className="text-sm text-slate-300 hover:text-white">
            Create account
          </Link>
        </div>
      </form>
    </GuestLayout>
  );
}
