"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExportPdfButton } from "@/components/features/export";

interface TableWithOccupancy {
  id: string;
  name: string;
  seats: number;
  _count?: { guests: number };
  _sum?: { pax: number | null };
}

interface Stats {
  totalTables: number;
  totalGuests: number;
  totalPax: number;
  assignedGuests: number;
  unassignedGuests: number;
  totalSeats: number;
  occupiedSeats: number;
  fullTables: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tables, setTables] = useState<TableWithOccupancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const response = await fetch("/api/auth");
      const data = await response.json();
      if (!data.authenticated) {
        router.push("/admin/login");
        return;
      }
      fetchStats();
    }

    async function fetchStats() {
      try {
        const [tablesRes, guestsRes] = await Promise.all([
          fetch("/api/tables"),
          fetch("/api/guests?limit=1"), // Just need stats, not all guests
        ]);

        const tablesResponse = await tablesRes.json();
        const guestsData = await guestsRes.json();

        // Handle case where tables API returns an array or error object
        const tablesData: TableWithOccupancy[] = Array.isArray(tablesResponse) ? tablesResponse : [];
        const guestStats = guestsData.stats || { total: 0, assigned: 0, totalPax: 0 };

        // Calculate seat statistics
        const totalSeats = tablesData.reduce((sum, t) => sum + t.seats, 0);
        const occupiedSeats = tablesData.reduce((sum, t) => sum + (t._sum?.pax || 0), 0);
        const fullTables = tablesData.filter((t) => (t._sum?.pax || 0) >= t.seats).length;

        setTables(tablesData);
        setStats({
          totalTables: tablesData.length || 0,
          totalGuests: guestStats.total,
          totalPax: guestStats.totalPax,
          assignedGuests: guestStats.assigned,
          unassignedGuests: guestStats.total - guestStats.assigned,
          totalSeats,
          occupiedSeats,
          fullTables,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center pattern-overlay">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#E8D5A3]" />
            <div className="absolute inset-0 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin" />
          </div>
          <p className="text-[#6B6B6B] font-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7] pattern-overlay">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E8D5A3] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F7E7CE] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1
                  className="text-2xl font-semibold text-[#3D3D3D]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Admin Dashboard
                </h1>
                <p className="text-sm text-[#6B6B6B]">Manage your wedding event</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="text-sm text-[#6B6B6B] hover:text-[#C9A227] transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">Guest View</span>
              </Link>
              <ExportPdfButton />
              <button
                onClick={handleLogout}
                className="text-sm text-[#6B6B6B] hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A227]" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C9A227]">
              <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8L12 2Z" fill="currentColor" opacity="0.6" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A227]" />
          </div>
          <p className="text-[#6B6B6B] font-light">Overview of your event</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
          {/* Total Tables */}
          <div className="wedding-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#9CAF88]/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#9CAF88]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#6B6B6B]">Total Tables</span>
              </div>
              <p
                className="text-4xl font-semibold text-[#3D3D3D]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stats?.totalTables || 0}
              </p>
            </div>
          </div>

          {/* Total Guests */}
          <div className="wedding-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A227]/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A227]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#6B6B6B]">Total Guests</span>
              </div>
              <p
                className="text-4xl font-semibold text-[#3D3D3D]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stats?.totalGuests || 0}
              </p>
            </div>
          </div>

          {/* Total Pax */}
          <div className="wedding-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8D5A3]/20 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8D5A3]/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#B8922A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m0-13A4 4 0 1012 9.646" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#6B6B6B]">Total Pax</span>
              </div>
              <p
                className="text-4xl font-semibold text-[#B8922A]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stats?.totalPax || 0}
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {stats?.totalSeats || 0} seats available
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2
            className="text-xl font-semibold text-[#3D3D3D] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Floor Plan Editor */}
          <Link href="/admin/floor-plan" className="group">
            <div className="wedding-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#9CAF88]/30">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9CAF88] to-[#7A9568] flex items-center justify-center shadow-lg shadow-[#9CAF88]/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-semibold text-[#3D3D3D] mb-2 group-hover:text-[#9CAF88] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Floor Plan Editor
                  </h3>
                  <p className="text-[#6B6B6B] font-light mb-4">
                    Arrange tables, manage fixtures, and customize your venue layout
                  </p>
                  <div className="flex items-center text-sm text-[#9CAF88] font-medium">
                    Open Editor
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Guest Management */}
          <Link href="/admin/guests" className="group">
            <div className="wedding-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#C9A227]/30">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#A88420] flex items-center justify-center shadow-lg shadow-[#C9A227]/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-semibold text-[#3D3D3D] mb-2 group-hover:text-[#C9A227] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Guest Management
                  </h3>
                  <p className="text-[#6B6B6B] font-light mb-4">
                    Add, edit, and assign guests to their designated tables
                  </p>
                  <div className="flex items-center text-sm text-[#C9A227] font-medium">
                    Manage Guests
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Table Occupancy Overview */}
        {tables.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xl font-semibold text-[#3D3D3D]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Table Occupancy
              </h2>
              {stats && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
                    Full ({stats.fullTables})
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500"></span>
                    Partial
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#9CAF88]"></span>
                    Available
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tables.map((table) => {
                const occupied = table._sum?.pax || 0;
                const available = table.seats - occupied;
                const percentage = (occupied / table.seats) * 100;
                const isFull = available <= 0;
                const isPartial = occupied > 0 && !isFull;

                return (
                  <div
                    key={table.id}
                    className={`wedding-card rounded-xl p-4 relative overflow-hidden transition-all ${
                      isFull ? 'ring-2 ring-red-300 bg-red-50/50' : ''
                    }`}
                  >
                    {/* Status indicator */}
                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                      isFull ? 'bg-red-500' : isPartial ? 'bg-amber-500' : 'bg-[#9CAF88]'
                    }`} />

                    <p className="font-semibold text-[#3D3D3D] text-sm mb-2">{table.name}</p>

                    {/* Progress bar */}
                    <div className="h-2 bg-[#F7E7CE] rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-red-500' : isPartial ? 'bg-amber-500' : 'bg-[#9CAF88]'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B6B6B]">
                        {occupied}/{table.seats} seats
                      </span>
                      {isFull ? (
                        <span className="text-red-600 font-medium">FULL</span>
                      ) : (
                        <span className="text-[#9CAF88]">{available} left</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {stats && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm text-[#6B6B6B]">
                <span>
                  <strong className="text-[#3D3D3D]">{stats.occupiedSeats}</strong> / {stats.totalSeats} total seats occupied
                </span>
                <span className="hidden sm:inline text-[#E8D5A3]">|</span>
                <span>
                  <strong className="text-[#3D3D3D]">{stats.totalSeats - stats.occupiedSeats}</strong> seats available
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center">
        <p className="text-xs text-[#6B6B6B]/50">
          Wedding Seat Management System
        </p>
      </footer>
    </div>
  );
}
