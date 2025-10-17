import { Head, Link, useForm } from "@inertiajs/react";

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (e) => {
    e.preventDefault();
    post("/register", {
      onSuccess: () => reset("password", "password_confirmation"),
    });
  };

  return (
    <>
      <Head title="Register" />
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <form onSubmit={submit} className="w-full max-w-sm p-6 bg-slate-800 rounded-lg">
          <h1 className="text-xl text-slate-100 mb-4">Create account</h1>

          <label className="block mb-2 text-slate-300">Name</label>
          <input
            className="w-full mb-3 rounded bg-slate-700 text-slate-100 p-2"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
            autoComplete="name"
          />
          {errors.name && <div className="text-red-400 text-sm mb-2">{errors.name}</div>}

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
            className="w-full mb-3 rounded bg-slate-700 text-slate-100 p-2"
            value={data.password}
            onChange={(e) => setData("password", e.target.value)}
            autoComplete="new-password"
          />
          {errors.password && <div className="text-red-400 text-sm mb-2">{errors.password}</div>}

          <label className="block mb-2 text-slate-300">Confirm password</label>
          <input
            type="password"
            className="w-full mb-4 rounded bg-slate-700 text-slate-100 p-2"
            value={data.password_confirmation}
            onChange={(e) => setData("password_confirmation", e.target.value)}
            autoComplete="new-password"
          />

          <button
            disabled={processing}
            className="w-full rounded bg-indigo-600 hover:bg-indigo-700 text-white py-2 disabled:opacity-50"
          >
            Create account
          </button>

          <div className="mt-4 text-sm text-slate-300">
            Already registered?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
