import { useEffect, useState } from "react";
import { api } from "../api/client";

export type Location = {
  id: number;
  room_name: string;    
  floor_level?: number;  
  description?: string;
};

type EditingLocation = Omit<Location, "id"> & { id?: number };

const EMPTY: EditingLocation = { room_name: "", floor_level: 0, description: "" };

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingLocation>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  // FIX PARSING AMAN DAN TOTAL: Memastikan tidak akan pernah ada Object yang lolos ke JSX React
  function parseBackendError(errorObj: any): string {
    if (!errorObj) return "An unknown error occurred";
    
    // Tarik data detail dari Axios Response
    const detail = errorObj?.response?.data?.detail;
    if (!detail) return errorObj.message || String(errorObj);

    // Jika detail berupa array (Validasi Pydantic default: [{type, loc, msg, input}])
    if (Array.isArray(detail)) {
      try {
        return detail.map((errItem: any) => {
          const locationPath = errItem?.loc ? errItem.loc.join(".") : "field";
          const message = errItem?.msg || "invalid value";
          return `[${locationPath}] ${message}`;
        }).join(" | ");
      } catch (parseEvalErr) {
        return "Validation failed on server parameters.";
      }
    }

    // Jika detail berupa objek tunggal
    if (typeof detail === "object") {
      if (detail.msg) return String(detail.msg);
      return JSON.stringify(detail);
    }

    return String(detail);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<Location[]>("/locations");
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setErr(parseBackendError(e)); // Aman, pasti string
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(EMPTY);
    setFormErr(null);
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing({ 
      id: loc.id, 
      room_name: loc.room_name, 
      floor_level: loc.floor_level ?? 0, 
      description: loc.description 
    });
    setFormErr(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!editing.room_name?.trim()) {
      setFormErr("Location name is required");
      return;
    }
    setSaving(true);
    setFormErr(null);
    try {
      // SINKRONISASI PAYLOAD BERDASARKAN SKEMA BACKEND (Mencegah Pydantic Lempar Error 422/500)
      const payload = {
        room_name: editing.room_name,
        // Jika di backend models.py kamu: floor_level: str = "", ubah Number() di bawah ini menjadi String()
        floor_level: Number(editing.floor_level) || 0, 
        description: editing.description || "",
      };

      if (editing.id != null) {
        await api.put(`/locations/${editing.id}`, payload);
      } else {
        await api.post("/locations", payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormErr(parseBackendError(e)); // Aman, pasti string
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    setErr(null);
    try {
      await api.delete(`/locations/${id}`);
      setDeleteId(null);
      await load();
    } catch (e: any) {
      setErr(parseBackendError(e)); // Aman, pasti string
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = locations.filter(
    (loc) =>
      (loc?.room_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (loc?.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      String(loc?.floor_level ?? "").includes(search)
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none transition-shadow"
          style={{ borderColor: "#cfccbc", color: "#03323f", backgroundColor: "#fff" }}
          placeholder="Search ruangan atau lantai…"
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
          + Tambah Ruangan / Lantai
        </button>
      </div>

      {err && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-medium">
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
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>Lantai</th>
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>Nama Ruangan</th>
                <th className="px-4 py-3 font-bold border-b" style={{ borderColor: "#d9d6be" }}>Keterangan</th>
                <th className="px-4 py-3 font-bold text-right border-b" style={{ borderColor: "#d9d6be" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: "#617578" }}>
                    {search ? "Tidak ada ruangan yang cocok." : "Belum ada ruangan yang ditambahkan."}
                  </td>
                </tr>
              )}
              {filtered.map((loc, i) => (
                <tr 
                  key={loc.id} 
                  className="transition-colors"
                  style={{ backgroundColor: "#f7f5e1", color: "#03323f" }}
                >
                  <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be", color: "#617578" }}>{i + 1}</td>
                  <td className="px-4 py-3 border-b font-semibold" style={{ borderColor: "#d9d6be", color: "#03323f" }}>Lantai {loc.floor_level ?? 0}</td>
                  <td className="px-4 py-3 border-b font-bold" style={{ borderColor: "#d9d6be", color: "#03323f" }}>
                    {loc.room_name ?? <span className="text-slate-400 italic">No Name</span>}
                  </td>
                  <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be", color: "#4b5c5e" }}>
                    {loc.description || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 border-b" style={{ borderColor: "#d9d6be" }}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(loc)}
                        className="text-xs px-2.5 py-1 rounded-md border transition-colors font-medium"
                        style={{
                          borderColor: "#cfccbc",
                          backgroundColor: "#fff",
                          color: "#03323f"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(loc.id)}
                        className="text-xs px-2.5 py-1 rounded-md border transition-colors font-medium"
                        style={{
                          borderColor: "#cfccbc",
                          backgroundColor: "#fff",
                          color: "#ef4444"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" style={{ backgroundColor: "#f7f5e1", border: "1px solid #d9d6be" }}>
            <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>
              {editing.id != null ? "Edit Ruangan / Lantai" : "Tambah Ruangan / Lantai"}
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Nama Ruangan *</label>
                <input
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.room_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, room_name: e.target.value })}
                  placeholder="e.g. Ruang Rapat A, Lab Komputer"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Posisi Lantai (Angka)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.floor_level ?? 0}
                  onChange={(e) => setEditing({ ...editing, floor_level: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 1, 2, 3"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold" style={{ color: "#03323f" }}>Keterangan</label>
                <input
                  className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
                  style={{ borderColor: "#cfccbc", color: "#03323f" }}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="e.g. Kapasitas 50 orang"
                />
              </div>
            </div>
            {formErr && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-medium">
                {formErr}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#d9d6be" }}>
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 text-sm rounded-lg border font-medium transition-colors bg-white"
                style={{ borderColor: "#cfccbc", color: "#03323f" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg font-bold disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: "#f7f5e1", border: "1px solid #d9d6be" }}>
            <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>Hapus Ruangan / Lantai?</h2>
            <p className="text-sm" style={{ color: "#4b5c5e" }}>
              Tindakan ini permanen dan akan menghapus semua jadwal terkait ruangan ini.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-2 text-sm rounded-lg border font-medium bg-white" 
                style={{ borderColor: "#cfccbc", color: "#03323f" }}
              >
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