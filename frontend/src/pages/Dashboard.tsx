import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Filters, { Location } from "../components/Filters";
import ScheduleMatrix, { MatrixData } from "../components/ScheduleMatrix";
import AssignmentModal, { EditingCell } from "../components/AssignmentModal";

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // FIX UTAMA: State untuk memanajemeni tanggal aktif (Format ISO: YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split("T")[0];
  });

  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // State internal untuk menangkap waktu lokal real-time (Format e.g., "14:00")
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  // FIX UTAMA: Refresh sekarang wajib menyertakan parameter kueri tanggal ke API matriks
  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [m, l] = await Promise.all([
        api.get<MatrixData>(`/assignments/matrix?date=${selectedDate}`),
        api.get<Location[]>("/locations"),
      ]);
      setMatrix(m.data);
      setLocations(l.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]); // Picu ulang fungsi penarikan data jika tanggal berubah

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Sync waktu lokal komputer setiap 60 detik
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f5e1" }}>
      {/* Header navigasi dengan latar belakang primer gelap dan aksen emas */}
      <header className="border-b" style={{ backgroundColor: "#03323f", borderColor: "rgba(253, 175, 23, 0.2)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold" style={{ color: "#fdaf17" }}>Event Staff Tracker</h1>
            <p className="text-[10px] sm:text-xs" style={{ color: "#ebeae1" }}>
              Signed in as <span className="font-semibold" style={{ color: "#fdaf17" }}>{user?.username}</span> ({user?.role})
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <Link
                to="/manage"
                className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-colors hover:opacity-90"
                style={{ backgroundColor: "#fdaf17", color: "#03323f" }}
              >
                Manage
              </Link>
            )}
            <button
              onClick={logout}
              className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-white/5"
              style={{ color: "#f7f5e1", borderColor: "rgba(247, 245, 225, 0.3)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      
      {/* FIX MOBILE SCROLL CONTAINER: 
        Menambahkan 'w-full overflow-x-auto' pada pembungkus luar agar tabel jam di sebelah kanan
        dapat digeser (scroll) dengan lancar di layar HP tanpa merusak layout elemen dasbor lainnya.
      */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-4 w-full overflow-hidden">
        <Filters
          search={search}
          onSearch={setSearch}
          locationId={locationFilter}
          onLocation={setLocationFilter}
          locations={locations}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        {err && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        {loading && !matrix && (
          <div className="text-sm font-semibold" style={{ color: "#03323f" }}>Loading…</div>
        )}
        
        {matrix && (
          <div className="w-full overflow-x-auto rounded-xl border bg-white shadow-sm" style={{ borderColor: "#d9d6be" }}>
            <ScheduleMatrix
              data={matrix}
              search={search}
              highlightSlot={currentTimeStr} 
              locationFilter={locationFilter}
              isAdmin={isAdmin}
              currentUser={user} 
              onCellClick={(c) => { 
                // FIX UTAMA: Sisipkan data tanggal aktif saat sel grid diklik ke modal form
                setEditing({ ...c, date: selectedDate }); 
                setModalOpen(true); 
              }}
            />
          </div>
        )}
        {!isAdmin && (
          <p className="text-xs font-medium" style={{ color: "#617578" }}>
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
    </div>
  );
}