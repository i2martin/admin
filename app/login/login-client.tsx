"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/travel-expenses";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Prijava</h1>

        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            setLoading(true);

            const res = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });

            setLoading(false);

            if (!res?.ok) {
              setErr("Neispravno korisničko ime ili lozinka.");
              return;
            }

            router.push(from);
          }}
        >
          <input
            className="w-full rounded-xl border px-3 py-2"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {err && <div className="text-sm text-red-600">{err}</div>}

          <button
            className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Prijava..." : "Prijava"}
          </button>
        </form>
      </div>
    </main>
  );
}
