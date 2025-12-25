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
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Guest Management</h1>
            </div>
            <Button onClick={() => setShowAddModal(true)}>Add Guest</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="mb-6">
          <SearchBar
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{guests.length}</p>
            <p className="text-sm text-gray-500">Total Guests</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-emerald-600">
              {guests.filter((g) => g.tableId).length}
            </p>
            <p className="text-sm text-gray-500">Assigned</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-amber-600">
              {guests.filter((g) => !g.tableId).length}
            </p>
            <p className="text-sm text-gray-500">Unassigned</p>
          </Card>
        </div>

        {/* Guest List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Table</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Seat</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No guests found
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{guest.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        {guest.table ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-sm">
                            {guest.table.name}
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {guest.seatNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {guest.phone || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(guest)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(guest)}
                          className="text-red-600 hover:text-red-800"
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
        </Card>
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
          <Input
            label="Name *"
            placeholder="Guest name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Table
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            <Input
              label="Seat Number"
              type="number"
              min={1}
              placeholder="Seat number"
              value={formData.seatNumber}
              onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
            />
          )}
          <Input
            label="Notes"
            placeholder="Special requirements, dietary, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddGuest}>Add Guest</Button>
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
          <Input
            label="Name *"
            placeholder="Guest name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Table
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            <Input
              label="Seat Number"
              type="number"
              min={1}
              placeholder="Seat number"
              value={formData.seatNumber}
              onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
            />
          )}
          <Input
            label="Notes"
            placeholder="Special requirements, dietary, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedGuest(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateGuest}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
