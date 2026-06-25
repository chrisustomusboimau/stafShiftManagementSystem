import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Filters, { Location } from "../components/Filters";
import ScheduleMatrix, { MatrixData } from "../components/ScheduleMatrix";
import AssignmentModal, { EditingCell } from "../components/AssignmentModal";
import StaffModal from "../components/StaffModal";
import LocationModal from "../components/LocationModal";

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [slot, setSlot] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [m, l] = await Promise.all([
        api.get<MatrixData>("/assignments/matrix"),
        api.get<Location[]>("/locations"),
      ]);
      setMatrix(m.data);
      setLocations(l.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh on tab focus (lightweight "realtime" alternative).
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Event Staff Tracker</h1>
            <p className="text-xs text-slate-500">
              Signed in as <span className="font-medium">{user?.username}</span> ({user?.role})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setStaffModalOpen(true)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  + Add Staff
                </button>
                <button
                  onClick={() => setLocationModalOpen(true)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  + Add Lantai
                </button>
              </>
            )}
            <button
              onClick={logout}
              className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        <Filters
          search={search}
          onSearch={setSearch}
          slot={slot}
          onSlot={setSlot}
          locationId={locationFilter}
          onLocation={setLocationFilter}
          locations={locations}
        />
        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        {loading && !matrix && (
          <div className="text-sm text-slate-500">Loading…</div>
        )}
        {matrix && (
          <ScheduleMatrix
            data={matrix}
            search={search}
            highlightSlot={slot}
            locationFilter={locationFilter}
            isAdmin={isAdmin}
            onCellClick={(c) => { setEditing(c); setModalOpen(true); }}
          />
        )}
        {!isAdmin && (
          <p className="text-xs text-slate-500">
            Read-only view. Ask an admin to make changes.
          </p>
        )}
      </main>
      <AssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        cell={editing}
        locations={locations}
      />
      <StaffModal
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        onSaved={refresh}
      />
      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}
