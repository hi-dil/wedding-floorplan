"use client";

import { useState, useEffect } from "react";
import { FloorPlanCanvas } from "@/components/features/floor-plan";
import { GuestSearchForm, GuestCard } from "@/components/features/guest-search";
import { FloorPlanData, Guest, Table } from "@/types";
import { Modal } from "@/components/ui";
import Link from "next/link";

interface SearchResult {
  guest: Guest;
  table: Table | null;
}

export default function Home() {
  const [floorPlan, setFloorPlan] = useState<FloorPlanData | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableGuests, setTableGuests] = useState<Guest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);

  useEffect(() => {
    async function fetchFloorPlan() {
      try {
        const response = await fetch("/api/venues");
        if (!response.ok) {
          throw new Error("Failed to fetch venue data");
        }
        const venue = await response.json();
        setFloorPlan({
          venue: {
            id: venue.id,
            name: venue.name,
            width: venue.width,
            height: venue.height,
          },
          tables: venue.tables,
          fixtures: venue.fixtures,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFloorPlan();
  }, []);

  const handleSelect = (result: SearchResult | null) => {
    setSelectedResult(result);
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    setIsLoadingGuests(true);
    setTableGuests([]);

    try {
      const response = await fetch(`/api/tables/${table.id}`);
      if (response.ok) {
        const data = await response.json();
        setTableGuests(data.guests || []);
      }
    } catch (err) {
      console.error("Failed to fetch table guests:", err);
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const closeTablePopup = () => {
    setSelectedTable(null);
    setTableGuests([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  if (error || !floorPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load floor plan</h2>
          <p className="text-gray-600 mb-4">{error || "No venue data found. Please set up the venue first."}</p>
          <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Wedding Seat Finder
            </h1>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Admin
            </Link>
          </div>
          <p className="text-gray-600 mt-1">{floorPlan.venue.name}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Section */}
        <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Seat
            </h2>
            <p className="text-gray-600">
              Enter your name below to find your assigned table
            </p>
          </div>
          <GuestSearchForm onSelect={handleSelect} />
        </section>

        {/* Floor Plan */}
        <section className="mb-8">
          <p className="text-sm text-gray-500 text-center mb-2">
            Click on any table to see the guest list
          </p>
          <FloorPlanCanvas
            venue={floorPlan.venue}
            tables={floorPlan.tables}
            fixtures={floorPlan.fixtures}
            highlightedTableId={selectedResult?.table?.id}
            onTableClick={handleTableClick}
            className="shadow-lg"
          />
        </section>

        {/* Selected Guest Info */}
        {selectedResult && (
          <section className="mb-8">
            <GuestCard guest={selectedResult.guest} table={selectedResult.table} />
          </section>
        )}

        {/* Legend */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-600">Tables</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Your Table</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-200"></div>
              <span className="text-sm text-gray-600">Stage / Fixtures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Walkway</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>Entrance: Depan Majma Mall</p>
        </div>
      </footer>

      {/* Table Guests Modal */}
      <Modal
        isOpen={selectedTable !== null}
        onClose={closeTablePopup}
        title={selectedTable?.name || "Table"}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{selectedTable?.seats} seats</span>
            <span>{tableGuests.length} guest{tableGuests.length !== 1 ? 's' : ''} assigned</span>
          </div>

          {isLoadingGuests ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : tableGuests.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tableGuests.map((guest, index) => (
                <div key={guest.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{guest.name}</p>
                    {guest.notes && (
                      <p className="text-sm text-gray-500">{guest.notes}</p>
                    )}
                  </div>
                  {guest.seatNumber && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Seat {guest.seatNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No guests assigned to this table yet</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
