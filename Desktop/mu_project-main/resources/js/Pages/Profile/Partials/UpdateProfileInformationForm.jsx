import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function UpdateProfileInformationForm({ mustVerifyEmail, status, className }) {
  const { auth } = usePage().props;

  const [name, setName] = useState(auth.user.name || '');
  const [email, setEmail] = useState(auth.user.email || '');
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('_method', 'patch');
    formData.append('name', name);
    formData.append('email', email);

    setProcessing(true);
    router.post(route('profile.update'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setSuccess(true);
        router.visit(route('cafeteria'), { preserveState: false });
      },
      onError: (err) => setErrors(err),
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <section className={className}>
      <header>
        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        <p className="mt-1 text-sm text-gray-600">Update your account’s name and email.</p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <label className="block font-medium text-sm text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
          {errors.name && <p className="text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-medium text-sm text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
          {errors.email && <p className="text-red-600">{errors.email}</p>}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={processing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save
          </button>
          {success && <p className="text-sm text-green-600">Saved.</p>}
        </div>
      </form>
    </section>
  );
}
