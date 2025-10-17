import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Welcome() {
  const { auth } = usePage().props;

  if (auth?.user) {
    window.location.href = route('cafeteria');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-white text-center p-6">
      <h1 className="text-4xl font-bold mb-4 text-blue-800">Welcome to the Cafeteria System</h1>
      <p className="text-gray-700 mb-8">Please login or register to access your dashboard.</p>
      <div className="space-x-4">
        <Link
          href={route('login')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Login
        </Link>
        <Link
          href={route('register')}
          className="bg-gray-300 text-black px-6 py-2 rounded hover:bg-gray-400"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
