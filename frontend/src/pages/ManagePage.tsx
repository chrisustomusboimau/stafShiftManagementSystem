import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import StaffManagement from "./StaffPage"; 
import LocationManagement from "./LocationsPage";

type Tab = "staff" | "locations";

export default function ManagePage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("staff");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f5e1" }}>
      {/* SATU-SATUNYA HEADER UTAMA - TEMA GELAP PREMIUM */}
      <header className="sticky top-0 z-10 border-b" style={{ backgroundColor: "#03323f", borderColor: "rgba(253, 175, 23, 0.2)" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm flex items-center gap-1 transition-colors font-medium"
              style={{ color: "#ebeae1" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fdaf17"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#ebeae1"}
            >
              ← Schedule
            </Link>
            <div className="h-8 w-px" style={{ backgroundColor: "rgba(247, 245, 225, 0.2)" }} /> 
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#fdaf17" }}>Manage</h1>
              <p className="text-xs" style={{ color: "#ebeae1" }}>
                Signed in as <span className="font-semibold" style={{ color: "#fdaf17" }}>{user?.username}</span> ({user?.role})
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-white/5"
            style={{ color: "#f7f5e1", borderColor: "rgba(247, 245, 225, 0.3)" }}
          >
            Sign out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-[1400px] mx-auto px-6 flex gap-1 border-t" style={{ borderColor: "rgba(253, 175, 23, 0.15)" }}>
          <button
            onClick={() => setTab("staff")}
            className="px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-[1px]"
            style={{
              borderColor: tab === "staff" ? "#fdaf17" : "transparent",
              color: tab === "staff" ? "#fdaf17" : "#ebeae1",
            }}
          >
            Staff
          </button>
          <button
            onClick={() => setTab("locations")}
            className="px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-[1px]"
            style={{
              borderColor: tab === "locations" ? "#fdaf17" : "transparent",
              color: tab === "locations" ? "#fdaf17" : "#ebeae1",
            }}
          >
            Ruangan / Lantai
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {tab === "staff" ? <StaffManagement /> : <LocationManagement />}
      </main>
    </div>
  );
}