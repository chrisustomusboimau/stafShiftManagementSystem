import { useMemo, useEffect, useRef } from "react";
import type { EditingCell } from "./AssignmentModal";

export type MatrixCell = {
  assignment_id: number;
  location: string;
  location_id: number;
  job_description: string;
  is_leave?: boolean; // 🔴 Tambahkan status penanda dari backend schemas
};

export type MatrixStaff = { id: number; name: string; division: string; username?: string };

export type MatrixData = {
  time_slots: string[];
  staff: MatrixStaff[];
  cells: Record<string, Record<string, MatrixCell>>;
};

type Props = {
  data: MatrixData;
  search: string;
  highlightSlot: string;
  locationFilter: string;
  isAdmin: boolean;
  currentUser: any; 
  onCellClick: (cell: EditingCell) => void;
};

export default function ScheduleMatrix({
  data, search, highlightSlot, locationFilter, isAdmin, currentUser, onCellClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper pencocokan slot waktu aktif
  const isSlotActive = (slotTarget: string, highlight: string) => {
    if (!highlight) return false;
    if (slotTarget === highlight) return true;
    
    if (slotTarget.includes("-")) {
      const [start, end] = slotTarget.split("-").map(t => t.trim());
      if (start && end) {
        return highlight >= start && highlight <= end;
      }
    }
    return false;
  };

  // Mencari tahu slot string mana yang saat ini sedang aktif
  const activeSlotName = useMemo(() => {
    return data.time_slots.find(slot => isSlotActive(slot, highlightSlot)) || "";
  }, [data.time_slots, highlightSlot]);

  // Effect untuk Auto-Scroll
  useEffect(() => {
    if (containerRef.current && highlightSlot) {
      const activeHeader = containerRef.current.querySelector('[data-active="true"]');
      if (activeHeader) {
        const container = containerRef.current;
        const headerOffset = (activeHeader as HTMLElement).offsetLeft;
        const staffColumnWidth = 260;

        container.scrollTo({
          left: headerOffset - staffColumnWidth,
          behavior: "smooth",
        });
      }
    }
  }, [highlightSlot, data.time_slots]);

  // Gabungkan penyaringan nama dan lokasi standby aktif saat ini
  const staff = useMemo(
    () =>
      data.staff
        .filter((s) => {
          // 1. Filter Nama Staff via search bar
          const matchesSearch = s.name.toLowerCase().includes(search.trim().toLowerCase());
          if (!matchesSearch) return false;

          // 2. Filter Lokasi Standby Saat Ini
          if (locationFilter) {
            const staffRowCells = data.cells[String(s.id)] ?? {};
            const currentActiveCell = activeSlotName ? staffRowCells[activeSlotName] : null;

            // Jika tidak ada tugas saat ini, atau sedang izin, atau lokasi tidak cocok, keluarkan dari list
            if (!currentActiveCell || currentActiveCell.is_leave || String(currentActiveCell.location_id) !== locationFilter) {
              return false;
            }
          }

          return true;
        })
        .sort((a, b) => {
          const usernameMe = currentUser?.username?.toLowerCase();
          const nameMe = currentUser?.name?.toLowerCase();

          const isMeA = usernameMe && (a.username?.toLowerCase() === usernameMe || a.name.toLowerCase() === nameMe);
          const isMeB = usernameMe && (b.username?.toLowerCase() === usernameMe || b.name.toLowerCase() === nameMe);

          if (isMeA) return -1; 
          if (isMeB) return 1;
          return a.name.localeCompare(b.name);
        }),
    [data.staff, data.cells, search, locationFilter, activeSlotName, currentUser]
  );

  return (
    <div 
      ref={containerRef} 
      className="border rounded-xl overflow-auto shadow-sm max-h-[75vh] scroll-smooth"
      style={{ backgroundColor: "#f7f5e1", borderColor: "#d9d6be" }}
    >
      <table className="min-w-max border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th 
              className="sticky top-0 left-0 z-30 border-b border-r px-4 py-3 text-left min-w-[260px] font-semibold"
              style={{ 
                backgroundColor: "#e8e5cd", 
                color: "#03323f", 
                borderColor: "#d9d6be" 
              }}
            >
              Staff
            </th>
            {data.time_slots.map((slot) => {
              const isHighlighted = isSlotActive(slot, highlightSlot);
              return (
                <th
                  key={slot}
                  data-active={isHighlighted ? "true" : "false"}
                  className="sticky top-0 z-20 border-b border-r px-3 py-3 text-xs font-semibold whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: isHighlighted ? "#03323f" : "#e8e5cd",
                    color: isHighlighted ? "#fdaf17" : "#03323f",
                    borderColor: "#d9d6be",
                    boxShadow: isHighlighted ? "inset 0_-2px_0 #fdaf17" : "none"
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{slot}</span>
                    {isHighlighted && (
                      <span 
                        className="text-[9px] px-1 py-0.2 rounded font-normal"
                        style={{ backgroundColor: "rgba(253, 175, 23, 0.2)", color: "#fdaf17" }}
                      >
                        Active Slot
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => {
            const row = data.cells[String(s.id)] ?? {};
            const currentActiveCell = activeSlotName ? row[activeSlotName] : null;
            
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
                {/* Kolom Nama Staf Sticky */}
                <td 
                  className="sticky left-0 z-10 border-b border-r px-4 py-3 min-w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors"
                  style={{ 
                    backgroundColor: isMe ? "#03323f" : "#f7f5e1",
                    borderColor: "#d9d6be"
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span 
                        className="font-bold"
                        style={{ color: isMe ? "#fdaf17" : "#03323f" }}
                      >
                        {s.name}
                        {isMe && (
                          <span 
                            className="text-[9px] px-1.5 py-0.5 rounded ml-1.5 font-normal tracking-wide uppercase"
                            style={{ backgroundColor: "#fdaf17", color: "#03323f" }}
                          >
                            Anda
                          </span>
                        )}
                      </span>
                      
                      <span 
                        className="text-[11px] font-normal"
                        style={{ color: isMe ? "#c7c4ae" : "#617578" }}
                      >
                        {s.division && s.division.toLowerCase() !== s.name.toLowerCase() ? s.division : ""}
                      </span>
                    </div>

                    {/* STATUS LOKASI STANDBY / FREE / IZIN */}
                    <div className="mt-0.5">
                      {currentActiveCell ? (
                        currentActiveCell.is_leave ? (
                          // Badge khusus jika staf sedang izin/absen di slot aktif saat ini
                          <div 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-md text-red-700 bg-red-50 border-red-300"
                          >
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>IZIN / ABSEN</span>
                          </div>
                        ) : (
                          <div 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-md max-w-[230px] truncate"
                            style={{ 
                              backgroundColor: isMe ? "rgba(253, 175, 23, 0.15)" : "#fff9ec", 
                              borderColor: "#fdaf17",
                              color: isMe ? "#fdaf17" : "#b37400"
                            }}
                          >
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Standby: <strong className="font-bold">{currentActiveCell.location}</strong></span>
                          </div>
                        )
                      ) : (
                        <div 
                          className="inline-flex items-center gap-1 text-[11px] font-medium border px-2 py-0.5 rounded-md"
                          style={{ 
                            backgroundColor: isMe ? "rgba(255, 255, 255, 0.1)" : "#ebeae1", 
                            borderColor: isMe ? "rgba(255, 255, 255, 0.2)" : "#cfccbc",
                            color: isMe ? "#c7c4ae" : "#617578"
                          }}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isMe ? "#c7c4ae" : "#617578" }} />
                          <span>Free</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Kolom-Kolom Slot Jam Grid */}
                {data.time_slots.map((slot) => {
                  const cell = row[slot];
                  const dim = locationFilter && cell && String(cell.location_id) !== locationFilter;
                  const highlighted = isSlotActive(slot, highlightSlot);
                  
                  const base = "border-b border-r px-3 py-2 text-xs align-top min-w-[150px] h-16 transition-colors";
                  
                  // FIX UTAMA: Kustomisasi warna background jika sel bertipe izin/absen
                  let gridBg = isMe ? "#03323f" : "#f7f5e1";
                  if (cell?.is_leave) {
                    gridBg = highlighted ? "#fee2e2" : "#fecaca"; // Merah pastel Tailwind kontras
                  } else if (highlighted) {
                    gridBg = isMe ? "#054354" : "#f2f0d5"; 
                  }

                  if (cell) {
                    return (
                      <td
                        key={slot}
                        className={`${base} ${dim ? "opacity-30" : ""} ${
                          isAdmin ? "cursor-pointer hover:opacity-80" : ""
                        }`}
                        style={{ backgroundColor: gridBg, borderColor: "#d9d6be" }}
                        onClick={() =>
                          isAdmin &&
                          onCellClick({
                            assignmentId: cell.assignment_id,
                            staffId: s.id,
                            staffName: s.name,
                            timeSlot: slot,
                            locationId: cell.location_id,
                            jobDescription: cell.job_description,
                            isLeave: cell.is_leave, // 🔴 Teruskan flag isLeave ke modal form
                          })
                        }
                      >
                        <div 
                          className="font-bold truncate"
                          style={{ color: cell.is_leave ? "#b91c1c" : (isMe ? "#fdaf17" : "#03323f") }}
                        >
                          {cell.is_leave ? "IZIN / ABSEN" : cell.location}
                        </div>
                        <div 
                          className="line-clamp-2 mt-0.5"
                          style={{ color: cell.is_leave ? "#7f1d1d" : (isMe ? "#e8e5cd" : "#4b5c5e") }}
                        >
                          {cell.job_description}
                        </div>
                      </td>
                    );
                  }
                  
                  return (
                    <td
                      key={slot}
                      className={`${base} ${
                        isAdmin
                          ? "cursor-pointer hover:bg-black/5 border-dashed text-center vertical-middle"
                          : ""
                      }`}
                      style={{ 
                        backgroundColor: gridBg,
                        borderColor: "#d9d6be",
                        color: isMe ? "rgba(255, 255, 255, 0.15)" : "rgba(3, 50, 63, 0.15)"
                      }}
                      onClick={() =>
                        isAdmin &&
                        onCellClick({
                          staffId: s.id,
                          staffName: s.name,
                          timeSlot: slot,
                        })
                      }
                    >
                      {isAdmin ? (
                        <span 
                          className="text-base font-light transition-colors"
                          style={{ color: isMe ? "#fdaf17" : "#03323f" }}
                        >
                          +
                        </span>
                      ) : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {staff.length === 0 && (
            <tr>
              <td
                colSpan={data.time_slots.length + 1}
                className="text-center py-8 font-medium"
                style={{ color: "#617578", backgroundColor: "#f7f5e1" }}
              >
                No staff match the current filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}