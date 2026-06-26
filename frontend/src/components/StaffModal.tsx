import { FormEvent, useState } from "react";
import { api } from "../api/client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function StaffModal({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [division, setDivision] = useState("");
  const [contact, setContact] = useState("");
  
  // State Baru untuk Kebutuhan Manajemen Akun / Login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff"); 

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Validasi input wajib
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    if (!username.trim()) {
      setErr("Username is required for account creation");
      return;
    }
    if (!password.trim()) {
      setErr("Password is required for account creation");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      // Mengirimkan payload gabungan data Staff dan data Akun ke Backend
      await api.post("/staff", { 
        name, 
        division, 
        contact,
        username: username.trim(),
        password: password,
        role: role
      });
      
      // Reset Form State
      setName("");
      setDivision("");
      setContact("");
      setUsername("");
      setPassword("");
      setRole("staff");
      
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form 
        onSubmit={onSubmit} 
        className="rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto border"
        style={{ backgroundColor: "#f7f5e1", borderColor: "#d9d6be" }}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>Add Staff & Account</h2>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "#617578" }}>
            Daftarkan personil sekaligus buatkan kredensial login akun mereka.
          </p>
        </div>

        {/* --- PROFIL PERSONIL --- */}
        <div className="border-b pb-3 space-y-3" style={{ borderColor: "#d9d6be" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#617578" }}>Biodata Profil</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>Name *</label>
            <input
              className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none transition-shadow"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Budi Santoso"
              autoFocus
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>Division / Role Kerja</label>
            <input
              className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none transition-shadow"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="e.g. Usher, Security, Logistik"
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>Contact</label>
            <input
              className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none transition-shadow"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone / email"
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
        </div>

        {/* --- KREDENSIAL AKUN LOGIN --- */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#617578" }}>Kredensial Login</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>Username Akun *</label>
            <input
              className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none transition-shadow"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. budisantoso12"
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>Password *</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none transition-shadow"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>Hak Akses Sistem (Role)</label>
            <select
              className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={(e) => {
                e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
                e.target.style.borderColor = "#03323f";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.borderColor = "#cfccbc";
              }}
            >
              <option value="staff">Staff (Hanya Lihat Jadwal)</option>
              <option value="admin">Admin (Bisa Atur Jadwal & Ruangan)</option>
            </select>
          </div>
        </div>

        {err && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#d9d6be" }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-sm rounded-lg border font-semibold transition-colors bg-white"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg font-bold disabled:opacity-60 transition-colors"
            style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
          >
            {saving ? "Saving…" : "Register Staff & Account"}
          </button>
        </div>
      </form>
    </div>
  );
}