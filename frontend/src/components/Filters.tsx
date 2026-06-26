import { TIME_SLOTS } from "../lib/timeSlots";

export type Location = { 
  id: number; 
  room_name: string; 
  floor_level: number; 
};

// FIX UTAMA: Definisikan tipe untuk properti kalender harian baru
type Props = {
  search: string;
  onSearch: (v: string) => void;
  locationId: string;
  onLocation: (v: string) => void;
  locations: Location[];
  selectedDate: string;             // 🔴 Tambahkan state tanggal aktif
  onDateChange: (v: string) => void; // 🔴 Tambahkan handler perubahan tanggal
};

export default function Filters({
  search, onSearch, locationId, onLocation, locations, selectedDate, onDateChange,
}: Props) {
  return (
    <div 
      className="flex flex-wrap gap-3 items-end p-4 border rounded-xl shadow-sm"
      style={{ backgroundColor: "#f7f5e1", borderColor: "#d9d6be" }} // Latar belakang krem kontras
    >
      {/* Filter Kalender / Tanggal Harian */}
      <div>
        <label 
          className="block text-xs font-bold mb-1 uppercase tracking-wide"
          style={{ color: "#03323f" }}
        >
          Pilih Tanggal
        </label>
        <input
          type="date"
          className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none transition-shadow font-semibold"
          style={{ 
            borderColor: "#cfccbc", 
            color: "#03323f",
          }}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
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

      {/* Search Staff */}
      <div>
        <label 
          className="block text-xs font-bold mb-1 uppercase tracking-wide"
          style={{ color: "#03323f" }}
        >
          Search staff
        </label>
        <input
          className="border rounded-lg px-3 py-1.5 text-sm w-56 bg-white focus:outline-none transition-shadow"
          style={{ 
            borderColor: "#cfccbc", 
            color: "#03323f",
          }}
          placeholder="Name…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
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

      {/* Filter Location */}
      <div>
        <label 
          className="block text-xs font-bold mb-1 uppercase tracking-wide"
          style={{ color: "#03323f" }}
        >
          Location
        </label>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm min-w-[180px] bg-white focus:outline-none transition-shadow"
          style={{ 
            borderColor: "#cfccbc", 
            color: "#03323f",
          }}
          value={locationId}
          onChange={(e) => onLocation(e.target.value)}
          onFocus={(e) => {
            e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
            e.target.style.borderColor = "#03323f";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "none";
            e.target.style.borderColor = "#cfccbc";
          }}
        >
          <option value="">All Rooms / Floors</option>
          {locations.map((l) => (
            <option key={l.id} value={String(l.id)}>
              Lantai {l.floor_level} – {l.room_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}