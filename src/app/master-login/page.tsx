"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function MasterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError("ایمیل یا رمز عبور اشتباه است.");
    

    router.push("/master-admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4 rounded-2xl bg-gray-800 p-8 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-white">ورود به مدیریت پلتفرم (SK Team)</h1>
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <input type="email" placeholder="ایمیل مدیر کل" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
        <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
        <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700">ورود</button>
      </form>
    </div>
  );
}
