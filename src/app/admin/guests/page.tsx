"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Modal, SearchBar } from "@/components/ui";
import { Guest, Table } from "@/types";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    tableId: "",
    seatNumber: "",
  });
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const response = await fetch("/api/auth");
      const data = await response.json();
      if (!data.authenticated) {
        router.push("/admin/login");
        return;
      }
      fetchData();
    }

    async function fetchData() {
      try {
        const [guestsRes, tablesRes] = await Promise.all([
          fetch(`/api/guests?search=${searchQuery}`),
          fetch("/api/tables"),
        ]);

        const guestsData = await guestsRes.json();
        const tablesData = await tablesRes.json();

        setGuests(guestsData.guests || []);
        setTables(tablesData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router, searchQuery]);

  const handleAddGuest = async () => {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
          tableId: formData.tableId || null,
          seatNumber: formData.seatNumber ? parseInt(formData.seatNumber) : null,
        }),
      });

      if (response.ok) {
        const newGuest = await response.json();
        setGuests((prev) => [...prev, newGuest]);
        resetForm();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Failed to add guest:", error);
    }
  };

  const handleUpdateGuest = async () => {
    if (!selectedGuest || !formData.name.trim()) return;

    try {
      const response = await fetch(`/api/guests/${selectedGuest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
          tableId: formData.tableId || null,
          seatNumber: formData.seatNumber ? parseInt(formData.seatNumber) : null,
        }),
      });

      if (response.ok) {
        const updatedGuest = await response.json();
        setGuests((prev) =>
          prev.map((g) => (g.id === selectedGuest.id ? updatedGuest : g))
        );
        resetForm();
        setShowEditModal(false);
        setSelectedGuest(null);
      }
    } catch (error) {
      console.error("Failed to update guest:", error);
    }
  };

  const handleDeleteGuest = async (guest: Guest) => {
    if (!confirm(`Delete ${guest.name}?`)) return;

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== guest.id));
      }
    } catch (error) {
      console.error("Failed to delete guest:", error);
    }
  };

  const openEditModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormData({
      name: guest.name,
      phone: guest.phone || "",
      email: guest.email || "",
      notes: guest.notes || "",
      tableId: guest.tableId || "",
      seatNumber: guest.seatNumber?.toString() || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      notes: "",
      tableId: "",
      seatNumber: "",
    });
  };

  const filteredGuests = guests.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center pattern-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7E7CE]/50 via-transparent to-[#F7E7CE]/30 pointer-events-none" />
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#C9A227] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7] pattern-overlay">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7E7CE]/50 via-transparent to-[#F7E7CE]/30 pointer-events-none" />

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-[#E8D5A3]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-[#6B6B6B] hover:text-[#C9A227] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1
                  className="text-2xl font-semibold text-[#3D3D3D]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Guest Management
                </h1>
                <p className="text-sm text-[#6B6B6B]">Manage your wedding guest list</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#C9A227]/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Guest
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white border border-[#E8D5A3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227] transition-all placeholder:text-[#6B6B6B]/50"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="wedding-card rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#C9A227]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p
              className="text-3xl font-semibold text-[#C9A227]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {guests.length}
            </p>
            <p className="text-sm text-[#6B6B6B]">Total Guests</p>
          </div>
          <div className="wedding-card rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#9CAF88]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p
              className="text-3xl font-semibold text-[#9CAF88]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {guests.filter((g) => g.tableId).length}
            </p>
            <p className="text-sm text-[#6B6B6B]">Assigned</p>
          </div>
          <div className="wedding-card rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5E1DA]/50 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p
              className="text-3xl font-semibold text-[#D4A574]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {guests.filter((g) => !g.tableId).length}
            </p>
            <p className="text-sm text-[#6B6B6B]">Unassigned</p>
          </div>
        </div>

        {/* Guest List */}
        <div className="wedding-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8D5A3] bg-[#F7E7CE]/30">
                  <th className="text-left py-4 px-6 font-medium text-[#3D3D3D]">Name</th>
                  <th className="text-left py-4 px-6 font-medium text-[#3D3D3D]">Table</th>
                  <th className="text-left py-4 px-6 font-medium text-[#3D3D3D]">Seat</th>
                  <th className="text-left py-4 px-6 font-medium text-[#3D3D3D]">Phone</th>
                  <th className="text-right py-4 px-6 font-medium text-[#3D3D3D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#6B6B6B]">
                      <svg className="w-12 h-12 mx-auto mb-3 text-[#E8D5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      No guests found
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="border-b border-[#E8D5A3]/50 hover:bg-[#F7E7CE]/20 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-medium text-[#3D3D3D]">{guest.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        {guest.table ? (
                          <span className="text-[#9CAF88] bg-[#9CAF88]/10 px-3 py-1 rounded-full text-sm font-medium">
                            {guest.table.name}
                          </span>
                        ) : (
                          <span className="text-[#D4A574] bg-[#F5E1DA]/50 px-3 py-1 rounded-full text-sm font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[#6B6B6B]">
                        {guest.seatNumber || "-"}
                      </td>
                      <td className="py-4 px-6 text-[#6B6B6B]">
                        {guest.phone || "-"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openEditModal(guest)}
                          className="text-[#C9A227] hover:text-[#B8922A] mr-4 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(guest)}
                          className="text-red-400 hover:text-red-600 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Guest Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Guest"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Name *</label>
            <input
              type="text"
              placeholder="Guest name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Phone</label>
            <input
              type="text"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Email</label>
            <input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">
              Assign to Table
            </label>
            <select
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227] bg-white"
              value={formData.tableId}
              onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
            >
              <option value="">-- Unassigned --</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name} ({table._count?.guests || 0}/{table.seats} seats)
                </option>
              ))}
            </select>
          </div>
          {formData.tableId && (
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Seat Number</label>
              <input
                type="number"
                min={1}
                placeholder="Seat number"
                value={formData.seatNumber}
                onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Notes</label>
            <input
              type="text"
              placeholder="Special requirements, dietary, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-[#E8D5A3] text-[#6B6B6B] rounded-lg hover:bg-[#F7E7CE]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGuest}
              className="flex-1 px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20"
            >
              Add Guest
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Guest Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGuest(null);
          resetForm();
        }}
        title="Edit Guest"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Name *</label>
            <input
              type="text"
              placeholder="Guest name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Phone</label>
            <input
              type="text"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Email</label>
            <input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">
              Assign to Table
            </label>
            <select
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227] bg-white"
              value={formData.tableId}
              onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
            >
              <option value="">-- Unassigned --</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name} ({table._count?.guests || 0}/{table.seats} seats)
                </option>
              ))}
            </select>
          </div>
          {formData.tableId && (
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Seat Number</label>
              <input
                type="number"
                min={1}
                placeholder="Seat number"
                value={formData.seatNumber}
                onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Notes</label>
            <input
              type="text"
              placeholder="Special requirements, dietary, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedGuest(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-[#E8D5A3] text-[#6B6B6B] rounded-lg hover:bg-[#F7E7CE]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateGuest}
              className="flex-1 px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
