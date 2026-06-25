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
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Name is required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await api.post("/staff", { name, division, contact });
      setName("");
      setDivision("");
      setContact("");
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
          <h2 className="text-lg font-semibold">Add staff</h2>
          <p className="text-sm text-slate-500">
            After adding, click any cell on their row to assign a location & jobdesk per time slot.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Name *</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Budi Santoso"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Division / Role</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            placeholder="e.g. Usher, Security, Logistik"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Contact</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Phone / email"
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
