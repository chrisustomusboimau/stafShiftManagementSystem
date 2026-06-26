import { FormEvent, useState } from "react";
import { api } from "../api/client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function LocationModal({ open, onClose, onSaved }: Props) {
  const [roomName, setRoomName] = useState("");
  const [floorLevel, setFloorLevel] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) {
      setErr("Room name is required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await api.post("/locations", { room_name: roomName, floor_level: floorLevel });
      setRoomName("");
      setFloorLevel("");
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
        className="rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border"
        style={{ backgroundColor: "#f7f5e1", borderColor: "#d9d6be" }}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>
            Add location / floor
          </h2>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "#617578" }}>
            Locations appear in the assignment dropdown when scheduling staff.
          </p>
        </div>

        {/* Input Floor / Lantai */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
            Floor / Lantai
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
            value={floorLevel}
            onChange={(e) => setFloorLevel(e.target.value)}
            placeholder="e.g. Lantai 1, Lantai 2, Basement"
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

        {/* Input Room Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
            Room name *
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Ballroom A, Lobby, Pintu Utama"
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}