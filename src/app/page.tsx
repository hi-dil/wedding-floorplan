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

// Decorative SVG components
const FloralCorner = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none">
    <path
      d="M0 80C0 80 20 60 40 60C60 60 60 40 60 40C60 40 60 20 40 20C20 20 0 0 0 0"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.3"
    />
    <circle cx="40" cy="40" r="3" fill="currentColor" opacity="0.5" />
    <circle cx="20" cy="60" r="2" fill="currentColor" opacity="0.3" />
    <circle cx="60" cy="20" r="2" fill="currentColor" opacity="0.3" />
  </svg>
);

const OrnamentalDivider = () => (
  <div className="flex items-center justify-center gap-4 py-6">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A227]" />
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C9A227]">
      <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8L12 2Z" fill="currentColor" opacity="0.6" />
    </svg>
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A227]" />
  </div>
);

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
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center pattern-overlay">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#E8D5A3] animate-ping opacity-20" />
            <div className="absolute inset-2 rounded-full border-2 border-[#C9A227] animate-spin" style={{ borderTopColor: 'transparent' }} />
            <svg className="absolute inset-0 w-full h-full text-[#C9A227] p-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <p className="text-[#6B6B6B] font-light tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
            Preparing your experience...
          </p>
        </div>
      </div>
    );
  }

  if (error || !floorPlan) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center pattern-overlay">
        <div className="text-center max-w-md mx-auto p-8 wedding-card rounded-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F5E1DA] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-[#3D3D3D] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Unable to Load
          </h2>
          <p className="text-[#6B6B6B] mb-6 font-light">
            {error || "No venue data found. Please set up the venue first."}
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A227] text-white rounded-full hover:bg-[#9CAF88] transition-colors font-medium"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7] pattern-overlay">
      {/* Elegant Hero Header */}
      <header className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7E7CE] via-[#FFFEF7] to-transparent" />

        {/* Floral corners */}
        <FloralCorner className="absolute top-4 left-4 text-[#C9A227] rotate-0" />
        <FloralCorner className="absolute top-4 right-4 text-[#C9A227] rotate-90" />

        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          {/* Decorative top element */}
          <div className="flex justify-center mb-6">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" className="text-[#C9A227]">
              <path d="M60 0C60 0 70 20 90 20C110 20 120 10 120 10" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <path d="M60 0C60 0 50 20 30 20C10 20 0 10 0 10" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <circle cx="60" cy="20" r="4" fill="currentColor" opacity="0.6" />
            </svg>
          </div>

          {/* Main title */}
          <p className="text-sm tracking-[0.3em] text-[#9CAF88] uppercase mb-4 font-light">
            Welcome to
          </p>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-semibold text-[#3D3D3D] mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {floorPlan.venue.name}
          </h1>

          <OrnamentalDivider />

          <p className="text-lg text-[#6B6B6B] font-light max-w-md mx-auto leading-relaxed">
            We are delighted to have you celebrate this special day with us
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Search Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2
              className="text-3xl md:text-4xl font-medium text-[#3D3D3D] mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Find Your Seat
            </h2>
            <p className="text-[#6B6B6B] font-light">
              Enter your name to discover your table assignment
            </p>
          </div>

          {/* Elegant search wrapper */}
          <div className="max-w-xl mx-auto">
            <div className="wedding-card rounded-2xl p-8 relative">
              {/* Corner decorations */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#C9A227]/30" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#C9A227]/30" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-[#C9A227]/30" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-[#C9A227]/30" />

              <GuestSearchForm onSelect={handleSelect} />
            </div>
          </div>
        </section>

        {/* Selected Guest Info */}
        {selectedResult && (
          <section className="mb-16 animate-fadeIn">
            <div className="max-w-xl mx-auto">
              <div className="wedding-card rounded-2xl p-6 border-2 border-[#9CAF88]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#9CAF88] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#9CAF88] font-medium uppercase tracking-wide">Found!</p>
                    <h3 className="text-xl font-semibold text-[#3D3D3D]" style={{ fontFamily: 'var(--font-display)' }}>
                      {selectedResult.guest.name}
                    </h3>
                  </div>
                </div>
                {selectedResult.table && (
                  <div className="bg-[#FFFEF7] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6B6B6B]">You are seated at</p>
                      <p className="text-2xl font-semibold text-[#C9A227]" style={{ fontFamily: 'var(--font-display)' }}>
                        {selectedResult.table.name}
                      </p>
                    </div>
                    {selectedResult.guest.seatNumber && (
                      <div className="text-right">
                        <p className="text-sm text-[#6B6B6B]">Seat Number</p>
                        <p className="text-2xl font-semibold text-[#3D3D3D]" style={{ fontFamily: 'var(--font-display)' }}>
                          {selectedResult.guest.seatNumber}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Floor Plan Section */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2
              className="text-2xl font-medium text-[#3D3D3D] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Venue Layout
            </h2>
            <p className="text-sm text-[#6B6B6B] font-light">
              Tap any table to view the guest list
            </p>
          </div>

          <div className="wedding-card rounded-2xl p-4 md:p-6">
            <FloorPlanCanvas
              venue={floorPlan.venue}
              tables={floorPlan.tables}
              fixtures={floorPlan.fixtures}
              highlightedTableId={selectedResult?.table?.id}
              onTableClick={handleTableClick}
              className="rounded-xl overflow-hidden"
            />
          </div>
        </section>

        {/* Legend Section */}
        <section className="mb-8">
          <div className="wedding-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8D5A3] to-transparent" />
              <h3
                className="text-lg font-medium text-[#3D3D3D] px-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Map Legend
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8D5A3] to-transparent" />
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F7E7CE] border-2 border-[#E8D5A3] shadow-md" />
                <span className="text-sm text-[#6B6B6B]">Guest Tables</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A227] border-2 border-[#B8922A] shadow-md ring-2 ring-[#C9A227]/30" />
                <span className="text-sm text-[#6B6B6B]">Your Table</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 rounded bg-[#f5f5f5] border border-[#E8D5A3]" />
                <span className="text-sm text-[#6B6B6B]">Pelamin</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 rounded bg-[#9CAF88] border border-[#7A9568]" />
                <span className="text-sm text-[#6B6B6B]">Walkway</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Elegant Footer */}
      <footer className="relative bg-gradient-to-t from-[#F7E7CE] to-transparent py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <OrnamentalDivider />

          <div className="mb-6">
            <p className="text-sm text-[#6B6B6B] uppercase tracking-widest mb-2">Entrance</p>
            <p
              className="text-xl text-[#3D3D3D] font-medium"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Depan Majma Mall
            </p>
          </div>

          <div className="flex justify-center gap-2 text-[#C9A227]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <p className="mt-6 text-xs text-[#6B6B6B]/60">
            Wishing you a wonderful celebration
          </p>
        </div>

        {/* Bottom floral corners */}
        <FloralCorner className="absolute bottom-4 left-4 text-[#C9A227] rotate-[270deg]" />
        <FloralCorner className="absolute bottom-4 right-4 text-[#C9A227] rotate-180" />
      </footer>

      {/* Table Guests Modal - Styled elegantly */}
      <Modal
        isOpen={selectedTable !== null}
        onClose={closeTablePopup}
        title={selectedTable?.name || "Table"}
      >
        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-center justify-between text-sm pb-4 border-b border-[#E8D5A3]">
            <span className="text-[#6B6B6B]">
              <span className="text-[#C9A227] font-semibold">{selectedTable?.seats}</span> seats
            </span>
            <span className="text-[#6B6B6B]">
              <span className="text-[#9CAF88] font-semibold">{tableGuests.length}</span> guest{tableGuests.length !== 1 ? 's' : ''} assigned
            </span>
          </div>

          {isLoadingGuests ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 rounded-full border-2 border-[#E8D5A3] border-t-[#C9A227] animate-spin" />
            </div>
          ) : tableGuests.length > 0 ? (
            <div className="divide-y divide-[#F7E7CE]">
              {tableGuests.map((guest, index) => (
                <div
                  key={guest.id}
                  className="py-4 flex items-center justify-between hover:bg-[#FFFEF7] -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7E7CE] flex items-center justify-center text-[#C9A227] font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#3D3D3D]">{guest.name}</p>
                      {guest.notes && (
                        <p className="text-sm text-[#6B6B6B] italic">{guest.notes}</p>
                      )}
                    </div>
                  </div>
                  {guest.seatNumber && (
                    <span className="text-sm text-[#C9A227] bg-[#F7E7CE] px-3 py-1 rounded-full font-medium">
                      Seat {guest.seatNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7E7CE] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#C9A227]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-[#6B6B6B] font-light">No guests assigned yet</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Add keyframes for fade animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
