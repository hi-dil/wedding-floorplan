"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";

interface Stats {
  totalTables: number;
  totalGuests: number;
  assignedGuests: number;
  unassignedGuests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
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
          fetch("/api/guests"),
        ]);

        const tables = await tablesRes.json();
        const guestsData = await guestsRes.json();

        const guests = guestsData.guests || [];
        const assigned = guests.filter((g: { tableId: string | null }) => g.tableId).length;

        setStats({
          totalTables: tables.length || 0,
          totalGuests: guests.length,
          assignedGuests: assigned,
          unassignedGuests: guests.length - assigned,
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                View Guest Page
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-500">Total Tables</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalTables || 0}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500">Total Guests</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalGuests || 0}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500">Assigned</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{stats?.assignedGuests || 0}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500">Unassigned</h3>
            <p className="text-3xl font-bold text-amber-600 mt-2">{stats?.unassignedGuests || 0}</p>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/floor-plan">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Floor Plan Editor</h3>
                  <p className="text-gray-600">Arrange tables and manage layout</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/guests">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Guest Management</h3>
                  <p className="text-gray-600">Add, edit, and assign guests to tables</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
