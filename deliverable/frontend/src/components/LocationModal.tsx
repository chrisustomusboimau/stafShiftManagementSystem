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
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add location / floor</h2>
          <p className="text-sm text-slate-500">
            Locations appear in the assignment dropdown when scheduling staff.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Floor / Lantai</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={floorLevel}
            onChange={(e) => setFloorLevel(e.target.value)}
            placeholder="e.g. Lantai 1, Lantai 2, Basement"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Room name *</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Ballroom A, Lobby, Pintu Utama"
          />
        </div>
        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-lg border">
            Cancel
          </button>
          <button
            disabled={saving}
            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
