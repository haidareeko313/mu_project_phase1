import { Head, Link, useForm } from "@inertiajs/react";

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post("/login");
  };

  return (
    <>
      <Head title="Log in" />
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <form onSubmit={submit} className="w-full max-w-sm p-6 bg-slate-800 rounded-lg">
          <h1 className="text-xl text-slate-100 mb-4">Log in</h1>

          <label className="block mb-2 text-slate-300">Email</label>
          <input
            type="email"
            className="w-full mb-3 rounded bg-slate-700 text-slate-100 p-2"
            value={data.email}
            onChange={(e) => setData("email", e.target.value)}
            autoComplete="username"
          />
          {errors.email && <div className="text-red-400 text-sm mb-2">{errors.email}</div>}

          <label className="block mb-2 text-slate-300">Password</label>
          <input
            type="password"
            className="w-full mb-2 rounded bg-slate-700 text-slate-100 p-2"
            value={data.password}
            onChange={(e) => setData("password", e.target.value)}
            autoComplete="current-password"
          />
          {errors.password && <div className="text-red-400 text-sm mb-2">{errors.password}</div>}

          <label className="inline-flex items-center gap-2 text-slate-300 mb-4">
            <input
              type="checkbox"
              checked={data.remember}
              onChange={(e) => setData("remember", e.target.checked)}
            />
            Remember me
          </label>

          <button
            disabled={processing}
            className="w-full rounded bg-indigo-600 hover:bg-indigo-700 text-white py-2 disabled:opacity-50"
          >
            Log in
          </button>

          <div className="mt-4 text-sm text-slate-300">
            New here?{" "}
            <Link href="/register" className="text-indigo-400 hover:underline">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
