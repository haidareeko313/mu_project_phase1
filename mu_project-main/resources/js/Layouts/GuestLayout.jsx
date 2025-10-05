import React from "react";

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Cafeteria</h1>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow">
          {children}
        </div>
      </div>
    </div>
  );
}
