import { useEffect, useState } from "react";
import { api } from "../api/client";

export type Staff = {
  id: number;
  name: string;
  division: string;
  contact: string;
  username?: string;
  role?: string;
};

// Tambahkan properti opsional pada tipe editing agar TypeScript mengenali state form akun baru
type EditingStaff = Omit<Staff, "id"> & { 
  id?: number;
  username?: string;
  password?: string;
  role?: string;
};

const EMPTY: EditingStaff = { name: "", division: "", contact: "", username: "", password: "", role: "staff" };

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // State untuk menyimpan data akun yang sedang aktif login
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal state untuk Tambah/Edit Profil & Akun
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingStaff>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  // Modal state untuk MANAJEMEN/RESET PASSWORD
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // 1. Dapatkan informasi otentikasi user aktif secara real-time
      try {
        const meRes = await api.get("/auth/me");
        setCurrentUser(meRes.data);
      } catch (e) {
        console.log("Not authenticated or system administrator logging in");
      }

      // 2. Tarik data seluruh personil staf dari database
      const res = await api.get<Staff[]>("/staff");
      setStaffList(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(EMPTY);
    setFormErr(null);
    setModalOpen(true);
  }

  function openEdit(s: Staff) {
    setEditing({ 
      id: s.id, 
      name: s.name, 
      division: s.division, 
      contact: s.contact,
      role: s.role ?? "staff"
    });
    setFormErr(null);
    setModalOpen(true);
  }

  function openResetPassword(s: Staff) {
    setSelectedStaff(s);
    setNewPassword("");
    setPasswordErr(null);
    setPasswordModalOpen(true);
  }

  async function handleSave() {
    if (!editing.name.trim()) {
      setFormErr("Name is required");
      return;
    }
    
    if (editing.id == null) {
      const currentUsername = editing.username || "";
      const currentPassword = editing.password || "";

      if (!currentUsername.trim()) {
          setFormErr("Username is required for account creation");
          return;
      }
      if (!currentPassword.trim()) {
          setFormErr("Password is required for account creation");
          return;
      }
    }

    setSaving(true);
    setFormErr(null);
    try {
      if (editing.id != null) {
        await api.put(`/staff/${editing.id}`, {
          name: editing.name,
          division: editing.division,
          contact: editing.contact,
          role: editing.role
        });
      } else {
        await api.post("/staff", {
          name: editing.name,
          division: editing.division,
          contact: editing.contact,
          username: (editing.username || "").trim(),
          password: editing.password || "",
          role: editing.role || "staff"
        });
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormErr(e?.response?.data?.detail ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword() {
    if (!newPassword.trim() || newPassword.length < 4) {
      setPasswordErr("Password wajib diisi (Minimal 4 karakter)");
      return;
    }
    if (!selectedStaff) return;

    setPasswordSaving(true);
    setPasswordErr(null);
    try {
      await api.put(`/staff/${selectedStaff.id}/password`, {
        password: newPassword
      });
      setPasswordModalOpen(false);
      alert(`Password untuk akun @${selectedStaff.username} berhasil diperbarui!`);
    } catch (e: any) {
      setPasswordErr(e?.response?.data?.detail ?? "Gagal memperbarui password");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await api.delete(`/staff/${id}`);
      setDeleteId(null);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Delete failed");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = staffList
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.division?.toLowerCase().includes(search.toLowerCase()) ||
        s.username?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const usernameMe = currentUser?.username?.toLowerCase();
      const nameMe = currentUser?.name?.toLowerCase();

      const isMeA = usernameMe && (a.username?.toLowerCase() === usernameMe || a.name.toLowerCase() === nameMe);
      const isMeB = usernameMe && (b.username?.toLowerCase() === usernameMe || b.name.toLowerCase() === nameMe);

      if (isMeA) return -1;
      if (isMeB) return 1;
      
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none transition-shadow"
          style={{ borderColor: "#cfccbc", color: "#03323f", backgroundColor: "#fff" }}
          placeholder="Search name, role, username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => {
            e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
            e.target.style.borderColor = "#03323f";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "none";
            e.target.style.borderColor = "#cfccbc";
          }}
        />
        <button
          onClick={openAdd}
          className="text-sm px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
        >
          + Add Staff
        </button>
      </div>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm font-medium" style={{ color: "#03323f" }}>Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border shadow-sm" style={{ backgroundColor: "#f7f5e1", borderColor: "#d9d6be" }}>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide font-bold" style={{ backgroundColor: "#e8e5cd", color: "#03323f" }}>
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>#</th>
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>Name / Username</th>
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>Division / Role Kerja</th>
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>Sistem Role</th>
                <th className="px-4 py-3 font-bold text-right border-b" style={{ borderColor: "#d9d6be" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: "#617578" }}>
                    No staff found.
                  </td>
                </tr>
              )}
              {filtered.map((s, i) => {
                const usernameMe = currentUser?.username?.toLowerCase();
                const nameMe = currentUser?.name?.toLowerCase();
                const isMe = usernameMe && (s.username?.toLowerCase() === usernameMe || s.name.toLowerCase() === nameMe);

                return (
                  <tr 
                    key={s.id} 
                    className="transition-colors"
                    style={{ 
                      backgroundColor: isMe ? "#03323f" : "#f7f5e1",
                      color: isMe ? "#f7f5e1" : "#03323f"
                    }}
                  >
                    <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be" }}>
                      {isMe ? (
                        <span className="font-bold uppercase text-xs tracking-wider" style={{ color: "#fdaf17" }}>You</span>
                      ) : (
                        <span style={{ color: "#617578" }}>{i + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be" }}>
                      <div className="font-bold" style={{ color: isMe ? "#fdaf17" : "#03323f" }}>
                        {s.name} 
                        {isMe && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded ml-1.5 font-normal tracking-wide uppercase" style={{ backgroundColor: "#fdaf17", color: "#03323f" }}>
                            ANDA
                          </span>
                        )}
                      </div>
                      <div style={{ color: isMe ? "#c7c4ae" : "#617578" }} className="text-xs">@{s.username || "no-account"}</div>
                    </td>
                    <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be", color: isMe ? "#e8e5cd" : "#4b5c5e" }}>
                      {s.division && s.division.toLowerCase() !== s.name.toLowerCase() ? s.division : "—"}
                    </td>
                    <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be" }}>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        s.role === "admin" 
                          ? isMe ? "bg-purple-900 text-purple-200 border border-purple-700" : "bg-purple-50 text-purple-700 border border-purple-100" 
                          : isMe ? "bg-slate-700 text-slate-200 border border-slate-600" : "bg-white text-slate-600 border border-slate-200"
                      }`}>
                        {s.role ?? "staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be" }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openResetPassword(s)}
                          className="text-xs px-2.5 py-1 rounded-md border transition-colors font-medium"
                          style={{
                            borderColor: isMe ? "#fdaf17" : "#cfccbc",
                            backgroundColor: isMe ? "rgba(253, 175, 23, 0.15)" : "#fff",
                            color: isMe ? "#fdaf17" : "#03323f"
                          }}
                        >
                          🔑 Password
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs px-2.5 py-1 rounded-md border transition-colors font-medium"
                          style={{
                            borderColor: isMe ? "rgba(255,255,255,0.3)" : "#cfccbc",
                            backgroundColor: isMe ? "rgba(255,255,255,0.1)" : "#fff",
                            color: isMe ? "#f7f5e1" : "#03323f"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="text-xs px-2.5 py-1 rounded-md border transition-colors font-medium"
                          style={{
                            borderColor: isMe ? "rgba(239,68,68,0.4)" : "#cfccbc",
                            backgroundColor: isMe ? "rgba(239,68,68,0.15)" : "#fff",
                            color: isMe ? "#fca5a5" : "#ef4444"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT STAFF & REGISTRASI AKUN */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#f7f5e1", border: "1px solid #d9d6be" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>
                {editing.id != null ? "Edit Staff Profile" : "Add Staff & Account"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#617578" }}>
                {editing.id != null 
                  ? "Perbarui informasi profil personil staff." 
                  : "Daftarkan personil sekaligus buatkan kredensial login akun mereka."}
              </p>
            </div>

            {/* Profil Personil */}
            <div className="border-b pb-3 space-y-3" style={{ borderColor: "#d9d6be" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#617578" }}>Biodata Profil</h3>
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Name *</label>
                <input
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Budi Santoso"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Division / Role Kerja</label>
                <input
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.division}
                  onChange={(e) => setEditing({ ...editing, division: e.target.value })}
                  placeholder="e.g. Usher, Security, Logistik"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Contact</label>
                <input
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.contact}
                  onChange={(e) => setEditing({ ...editing, contact: e.target.value })}
                  placeholder="Phone / email"
                />
              </div>
            </div>

            {/* Kredensial Login */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#617578" }}>Akses Sistem</h3>
              
              {editing.id == null && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold" style={{ color: "#03323f" }}>Username Akun *</label>
                    <input
                      className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                      style={{ borderColor: "#cfccbc", color: "#03323f" }}
                      value={editing.username ?? ""}
                      onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                      placeholder="e.g. budisantoso12"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold" style={{ color: "#03323f" }}>Password *</label>
                    <input
                      type="password"
                      className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                      style={{ borderColor: "#cfccbc", color: "#03323f" }}
                      value={editing.password ?? ""}
                      onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Hak Akses Sistem (Role)</label>
                <select
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.role ?? "staff"}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                >
                  <option value="staff">Staff (Hanya Lihat Jadwal)</option>
                  <option value="admin">Admin (Bisa Atur Jadwal & Ruangan)</option>
                </select>
              </div>
            </div>

            {formErr && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formErr}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#d9d6be" }}>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)} 
                className="px-3 py-2 text-sm rounded-lg border font-medium transition-colors bg-white"
                style={{ borderColor: "#cfccbc", color: "#03323f" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg font-bold disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
              >
                {saving ? "Saving…" : "Save Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {passwordModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: "#f7f5e1", border: "1px solid #d9d6be" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>Manage Account Password</h2>
              <p className="text-xs mt-0.5" style={{ color: "#617578" }}>
                Mengubah password login untuk akun <strong style={{ color: "#03323f" }}>@{selectedStaff.username}</strong> ({selectedStaff.name}).
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold" style={{ color: "#03323f" }}>Password Baru *</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                style={{ borderColor: "#cfccbc", color: "#03323f" }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru..."
                autoFocus
              />
            </div>
            {passwordErr && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                {passwordErr}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#d9d6be" }}>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white"
                style={{ borderColor: "#cfccbc", color: "#03323f" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={passwordSaving}
                className="px-3 py-1.5 text-xs font-bold rounded-lg disabled:opacity-60"
                style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
              >
                {passwordSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE */}
      {deleteId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: "#f7f5e1", border: "1px solid #d9d6be" }}>
            <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>Delete Staff?</h2>
            <p className="text-sm" style={{ color: "#4b5c5e" }}>
              Tindakan ini akan menghapus akun beserta seluruh jadwal shift kerja milik staff ini.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setDeleteId(null)} className="px-3 py-2 text-sm rounded-lg border font-medium bg-white" style={{ borderColor: "#cfccbc", color: "#03323f" }}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-3 py-2 text-sm rounded-lg font-bold disabled:opacity-60 text-white bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}