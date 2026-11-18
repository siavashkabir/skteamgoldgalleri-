"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MasterLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // رمز عبور و نام کاربری موقت
    if (username === "skteam" && password === "123456") {
      // ذخیره یک کوکی ساده برای احراز هویت موقت
      document.cookie = "master_auth=true; path=/";
      router.push("/master-admin");
    } else {
      setError("نام کاربری یا رمز عبور اشتباه است.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-[#151514] p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">ورود به مدیریت پلتفرم</h1>
          <p className="text-sm text-gray-400">SK Team Platform Admin</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="نام کاربری" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            className="w-full rounded-xl border border-white/10 bg-[#10100f] p-4 text-white outline-none focus:border-[#d6ad56]" 
            dir="ltr"
            required 
            disabled={loading}
          />
          <input 
            type="password" 
            placeholder="رمز عبور" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full rounded-xl border border-white/10 bg-[#10100f] p-4 text-white outline-none focus:border-[#d6ad56]" 
            dir="ltr"
            required 
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full rounded-xl bg-[#d6ad56] p-4 font-bold text-black transition hover:bg-[#e2bf70] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "در حال ورود..." : "ورود"}
        </button>
        
        <div className="text-center text-xs text-gray-500">
          <p>نام کاربری: skteam</p>
          <p>رمز عبور: 123456</p>
        </div>
      </form>
    </div>
  );
}
