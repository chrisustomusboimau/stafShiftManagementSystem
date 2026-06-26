import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(u, p);
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 space-y-3"
      style={{ backgroundColor: "#f7f5e1" }} // Latar belakang krem terang halaman
    >
      <form 
        onSubmit={onSubmit} 
        className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5 border shadow-md"
        style={{ borderColor: "#d9d6be" }}
        autoComplete="off" // FIX BROWSER AUTOFILL: Mematikan autofill bawaan pada level form
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#03323f" }}>
            Event Staff Tracker
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#617578" }}>
            Sign in to continue
          </p>
        </div>

        {/* Input Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
            Username
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoFocus
            autoComplete="one-time-code" // Trik pelindung tambahan untuk memblokir deteksi otomatis pengelola kata sandi
            onFocus={(e) => {
              e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
              e.target.style.borderColor = "#03323f";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.borderColor = "#cfccbc";
            }}
          />
        </div>

        {/* Input Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
            Password
          </label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="new-password" // FIX BROWSER AUTOFILL: Memaksa browser menganggap ini kolom baru dan membiarkannya kosong
            onFocus={(e) => {
              e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
              e.target.style.borderColor = "#03323f";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.borderColor = "#cfccbc";
            }}
          />
        </div>

        {err && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        {/* Tombol Sign In */}
        <button
          disabled={loading}
          className="w-full font-bold rounded-lg py-2 transition-all disabled:opacity-60"
          style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#fdaf17";
              e.currentTarget.style.color = "#03323f";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#03323f";
              e.currentTarget.style.color = "#f7f5e1";
            }
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Watermark Branding di luar kotak login */}
      <div className="text-xs font-medium tracking-wide select-none" style={{ color: "#617578" }}>
        by: <span className="font-semibold" style={{ color: "#03323f" }}>Chrisustomus Boimau</span>
      </div>
    </div>
  );
}