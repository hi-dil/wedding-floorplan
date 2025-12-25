"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { Button, Card, Input, Modal } from "@/components/ui";
import { Table, Fixture, Venue } from "@/types";

type DragTarget =
  | { type: "table"; id: string }
  | { type: "fixture"; id: string }
  | { type: "resize"; fixtureId: string; handle: string };

export default function FloorPlanEditor() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [clickedOnElement, setClickedOnElement] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
        const response = await fetch("/api/venues");
        if (response.ok) {
          const data = await response.json();
          setVenue({
            id: data.id,
            name: data.name,
            width: data.width,
            height: data.height,
          });
          setTables(data.tables || []);
          setFixtures(data.fixtures || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleSavePositions = async () => {
    setIsSaving(true);
    try {
      // Save tables
      const tablesResponse = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: tables.map((t) => ({ id: t.id, x: t.x, y: t.y })),
        }),
      });

      // Save fixtures
      const fixturesResponse = await fetch("/api/fixtures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtures: fixtures.map((f) => ({
            id: f.id,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
          })),
        }),
      });

      if (!tablesResponse.ok || !fixturesResponse.ok) {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save positions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTableName.trim() || !venue) return;

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTableName,
          x: 200,
          y: 200,
          venueId: venue.id,
        }),
      });

      if (response.ok) {
        const newTable = await response.json();
        setTables((prev) => [...prev, newTable]);
        setNewTableName("");
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Failed to add table:", error);
    }
  };

  const handleDeleteTable = async () => {
    if (selectedTables.length === 0) return;

    const count = selectedTables.length;
    if (!confirm(`Delete ${count} table${count > 1 ? 's' : ''}? Guests will be unassigned.`)) {
      return;
    }

    try {
      for (const table of selectedTables) {
        await fetch(`/api/tables/${table.id}`, {
          method: "DELETE",
        });
      }
      setTables((prev) => prev.filter((t) => !selectedTables.some((s) => s.id === t.id)));
      setSelectedTables([]);
    } catch (error) {
      console.error("Failed to delete table:", error);
    }
  };

  const handleUpdateTable = async () => {
    if (selectedTables.length !== 1) return;
    const selectedTable = selectedTables[0];

    try {
      const response = await fetch(`/api/tables/${selectedTable.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTable),
      });

      if (response.ok) {
        setTables((prev) =>
          prev.map((t) => (t.id === selectedTable.id ? selectedTable : t))
        );
      }
    } catch (error) {
      console.error("Failed to update table:", error);
    }
  };

  const handleUpdateFixture = async () => {
    if (!selectedFixture) return;

    try {
      const response = await fetch(`/api/fixtures/${selectedFixture.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedFixture),
      });

      if (response.ok) {
        setFixtures((prev) =>
          prev.map((f) => (f.id === selectedFixture.id ? selectedFixture : f))
        );
      }
    } catch (error) {
      console.error("Failed to update fixture:", error);
    }
  };

  const handleDeleteFixture = async () => {
    if (!selectedFixture) return;

    if (!confirm(`Delete ${selectedFixture.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/fixtures/${selectedFixture.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFixtures((prev) => prev.filter((f) => f.id !== selectedFixture.id));
        setSelectedFixture(null);
      }
    } catch (error) {
      console.error("Failed to delete fixture:", error);
    }
  };

  // Get SVG coordinates from mouse event
  const getSvgCoords = (e: React.MouseEvent, svg: SVGSVGElement) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()?.inverse());
  };

  // Table mouse down
  const handleTableMouseDown = (e: React.MouseEvent, table: Table) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setClickedOnElement(true);

    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const coords = getSvgCoords(e, svg);
    setDragStart({ x: coords.x, y: coords.y });

    // Multi-select with Ctrl/Cmd
    if (e.ctrlKey || e.metaKey) {
      const isSelected = selectedTables.some((t) => t.id === table.id);
      if (isSelected) {
        setSelectedTables((prev) => prev.filter((t) => t.id !== table.id));
      } else {
        setSelectedTables((prev) => [...prev, table]);
      }
      setSelectedFixture(null);
    } else {
      // Single select
      const isAlreadySelected = selectedTables.some((t) => t.id === table.id);
      if (!isAlreadySelected) {
        setSelectedTables([table]);
      }
      setSelectedFixture(null);
      setIsDragging(true);
      setDragTarget({ type: "table", id: table.id });
    }
  };

  // Fixture mouse down
  const handleFixtureMouseDown = (e: React.MouseEvent, fixture: Fixture) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setClickedOnElement(true);

    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const coords = getSvgCoords(e, svg);
    setDragStart({ x: coords.x, y: coords.y });
    setSelectedFixture(fixture);
    setSelectedTables([]);
    setIsDragging(true);
    setDragTarget({ type: "fixture", id: fixture.id });
  };

  // Resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, fixture: Fixture, handle: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setClickedOnElement(true);

    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const coords = getSvgCoords(e, svg);
    setDragStart({ x: coords.x, y: coords.y });
    setResizeStart({ x: fixture.x, y: fixture.y, width: fixture.width, height: fixture.height });
    setIsDragging(true);
    setDragTarget({ type: "resize", fixtureId: fixture.id, handle });
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragTarget) return;

    const svg = e.currentTarget as SVGSVGElement;
    const coords = getSvgCoords(e, svg);
    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;

    if (dragTarget.type === "table") {
      // Move all selected tables together
      setTables((prev) =>
        prev.map((t) => {
          if (selectedTables.some((s) => s.id === t.id)) {
            return { ...t, x: t.x + deltaX, y: t.y + deltaY };
          }
          return t;
        })
      );
      setSelectedTables((prev) =>
        prev.map((t) => ({ ...t, x: t.x + deltaX, y: t.y + deltaY }))
      );
      setDragStart({ x: coords.x, y: coords.y });
    } else if (dragTarget.type === "fixture") {
      setFixtures((prev) =>
        prev.map((f) =>
          f.id === dragTarget.id ? { ...f, x: f.x + deltaX, y: f.y + deltaY } : f
        )
      );
      if (selectedFixture?.id === dragTarget.id) {
        setSelectedFixture((prev) =>
          prev ? { ...prev, x: prev.x + deltaX, y: prev.y + deltaY } : null
        );
      }
      setDragStart({ x: coords.x, y: coords.y });
    } else if (dragTarget.type === "resize") {
      const { handle, fixtureId } = dragTarget;

      setFixtures((prev) =>
        prev.map((f) => {
          if (f.id !== fixtureId) return f;

          let newX = resizeStart.x;
          let newY = resizeStart.y;
          let newWidth = resizeStart.width;
          let newHeight = resizeStart.height;

          // Handle different resize directions
          if (handle.includes("w")) {
            newX = resizeStart.x + deltaX;
            newWidth = resizeStart.width - deltaX;
          }
          if (handle.includes("e")) {
            newWidth = resizeStart.width + deltaX;
          }
          if (handle.includes("n")) {
            newY = resizeStart.y + deltaY;
            newHeight = resizeStart.height - deltaY;
          }
          if (handle.includes("s")) {
            newHeight = resizeStart.height + deltaY;
          }

          // Minimum size
          newWidth = Math.max(30, newWidth);
          newHeight = Math.max(30, newHeight);

          return { ...f, x: newX, y: newY, width: newWidth, height: newHeight };
        })
      );

      // Update selected fixture
      if (selectedFixture?.id === fixtureId) {
        const updatedFixture = fixtures.find((f) => f.id === fixtureId);
        if (updatedFixture) {
          setSelectedFixture(updatedFixture);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // Click on canvas background to deselect
  const handleCanvasClick = () => {
    // Only deselect if we didn't click on an element
    if (!clickedOnElement) {
      setSelectedTables([]);
      setSelectedFixture(null);
    }
    setClickedOnElement(false);
  };

  // Select all tables in the same row
  const handleSelectRow = () => {
    if (selectedTables.length === 0) return;
    const tolerance = 30;
    const targetY = selectedTables[0].y;

    const rowTables = tables.filter((t) => Math.abs(t.y - targetY) < tolerance);
    setSelectedTables(rowTables);
  };

  // Select all tables in the same column
  const handleSelectColumn = () => {
    if (selectedTables.length === 0) return;
    const tolerance = 30;
    const targetX = selectedTables[0].x;

    const colTables = tables.filter((t) => Math.abs(t.x - targetX) < tolerance);
    setSelectedTables(colTables);
  };

  // Render resize handles for selected fixture
  const renderResizeHandles = (fixture: Fixture) => {
    const handleSize = 10;
    const handles = [
      { id: "nw", x: fixture.x - handleSize / 2, y: fixture.y - handleSize / 2 },
      { id: "n", x: fixture.x + fixture.width / 2 - handleSize / 2, y: fixture.y - handleSize / 2 },
      { id: "ne", x: fixture.x + fixture.width - handleSize / 2, y: fixture.y - handleSize / 2 },
      { id: "e", x: fixture.x + fixture.width - handleSize / 2, y: fixture.y + fixture.height / 2 - handleSize / 2 },
      { id: "se", x: fixture.x + fixture.width - handleSize / 2, y: fixture.y + fixture.height - handleSize / 2 },
      { id: "s", x: fixture.x + fixture.width / 2 - handleSize / 2, y: fixture.y + fixture.height - handleSize / 2 },
      { id: "sw", x: fixture.x - handleSize / 2, y: fixture.y + fixture.height - handleSize / 2 },
      { id: "w", x: fixture.x - handleSize / 2, y: fixture.y + fixture.height / 2 - handleSize / 2 },
    ];

    const cursorMap: Record<string, string> = {
      nw: "nwse-resize",
      n: "ns-resize",
      ne: "nesw-resize",
      e: "ew-resize",
      se: "nwse-resize",
      s: "ns-resize",
      sw: "nesw-resize",
      w: "ew-resize",
    };

    return handles.map((h) => (
      <rect
        key={h.id}
        x={h.x}
        y={h.y}
        width={handleSize}
        height={handleSize}
        fill="#C9A227"
        stroke="#B8922A"
        strokeWidth="1"
        rx="2"
        style={{ cursor: cursorMap[h.id] }}
        onMouseDown={(e) => handleResizeMouseDown(e, fixture, h.id)}
      />
    ));
  };

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

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center pattern-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7E7CE]/50 via-transparent to-[#F7E7CE]/30 pointer-events-none" />
        <p className="relative text-[#6B6B6B]">No venue found</p>
      </div>
    );
  }

  const selectedTable = selectedTables.length === 1 ? selectedTables[0] : null;

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
                  Floor Plan Editor
                </h1>
                <p className="text-sm text-[#6B6B6B]">Arrange tables and fixtures for your venue</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 border border-[#E8D5A3] text-[#3D3D3D] rounded-xl hover:bg-[#F7E7CE]/50 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </button>
              <button
                onClick={handleSavePositions}
                disabled={isSaving}
                className="px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#C9A227]/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Floor Plan Canvas */}
          <div className="lg:col-span-3">
            <div className="wedding-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#6B6B6B]">
                  Click to select. Ctrl+click for multi-select. Drag to move.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectRow}
                    disabled={selectedTables.length === 0}
                    className="px-3 py-1.5 text-sm border border-[#E8D5A3] text-[#3D3D3D] rounded-lg hover:bg-[#F7E7CE]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select Row
                  </button>
                  <button
                    onClick={handleSelectColumn}
                    disabled={selectedTables.length === 0}
                    className="px-3 py-1.5 text-sm border border-[#E8D5A3] text-[#3D3D3D] rounded-lg hover:bg-[#F7E7CE]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select Column
                  </button>
                </div>
              </div>
              <div className="overflow-auto bg-[#FFFEF7] rounded-lg border border-[#E8D5A3]">
                <svg
                  viewBox={`0 0 ${venue.width} ${venue.height}`}
                  className="w-full h-auto min-h-[500px]"
                  style={{ maxHeight: "70vh" }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
                >
                  {/* Background */}
                  <rect x="0" y="0" width={venue.width} height={venue.height} fill="#FFFEF7" />
                  <rect
                    x="10"
                    y="10"
                    width={venue.width - 20}
                    height={venue.height - 20}
                    fill="none"
                    stroke="#E8D5A3"
                    strokeWidth="2"
                    rx="8"
                  />

                  {/* Fixtures */}
                  {fixtures.map((fixture) => {
                    const isSelected = selectedFixture?.id === fixture.id;
                    return (
                      <g key={fixture.id}>
                        <rect
                          x={fixture.x}
                          y={fixture.y}
                          width={fixture.width}
                          height={fixture.height}
                          fill={fixture.color || "#9CAF88"}
                          stroke={isSelected ? "#C9A227" : "#7A9568"}
                          strokeWidth={isSelected ? 3 : 1}
                          rx="4"
                          style={{ cursor: "move" }}
                          onMouseDown={(e) => handleFixtureMouseDown(e, fixture)}
                        />
                        <text
                          x={fixture.x + fixture.width / 2}
                          y={fixture.y + fixture.height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="14"
                          fontWeight="600"
                          fill="#3D3D3D"
                          style={{ pointerEvents: "none" }}
                        >
                          {fixture.name}
                        </text>
                        {isSelected && renderResizeHandles(fixture)}
                      </g>
                    );
                  })}

                  {/* Tables */}
                  {tables.map((table) => {
                    const centerX = table.x + table.width / 2;
                    const centerY = table.y + table.height / 2;
                    const radius = Math.min(table.width, table.height) / 2;
                    const isSelected = selectedTables.some((t) => t.id === table.id);

                    return (
                      <g
                        key={table.id}
                        onMouseDown={(e) => handleTableMouseDown(e, table)}
                        style={{ cursor: "move" }}
                      >
                        {table.shape === "ROUND" ? (
                          <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill={isSelected ? "#C9A227" : "#F7E7CE"}
                            stroke={isSelected ? "#B8922A" : "#E8D5A3"}
                            strokeWidth={isSelected ? 3 : 2}
                          />
                        ) : (
                          <rect
                            x={table.x}
                            y={table.y}
                            width={table.width}
                            height={table.height}
                            fill={isSelected ? "#C9A227" : "#F7E7CE"}
                            stroke={isSelected ? "#B8922A" : "#E8D5A3"}
                            strokeWidth={isSelected ? 3 : 2}
                            rx="4"
                          />
                        )}
                        {/* Seats */}
                        {table.shape === "ROUND" &&
                          Array.from({ length: table.seats }).map((_, i) => {
                            const angle = (i * 360) / table.seats - 90;
                            const seatRadius = radius + 12;
                            const seatX = centerX + seatRadius * Math.cos((angle * Math.PI) / 180);
                            const seatY = centerY + seatRadius * Math.sin((angle * Math.PI) / 180);
                            return (
                              <circle
                                key={i}
                                cx={seatX}
                                cy={seatY}
                                r="6"
                                fill="#F5E1DA"
                                stroke="#E8D5A3"
                                strokeWidth="1"
                              />
                            );
                          })}
                        <text
                          x={centerX}
                          y={centerY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="14"
                          fontWeight="700"
                          fill={isSelected ? "#FFFFFF" : "#3D3D3D"}
                          style={{ pointerEvents: "none" }}
                        >
                          {table.name.replace("Table ", "")}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="lg:col-span-1">
            <div className="wedding-card rounded-xl p-6">
              {/* Fixture Properties */}
              {selectedFixture && (
                <>
                  <h3
                    className="text-lg font-semibold text-[#3D3D3D] mb-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Fixture Properties
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Name</label>
                      <input
                        type="text"
                        value={selectedFixture.name}
                        onChange={(e) =>
                          setSelectedFixture({ ...selectedFixture, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-[#3D3D3D] mb-1">X</label>
                        <input
                          type="number"
                          value={Math.round(selectedFixture.x)}
                          onChange={(e) =>
                            setSelectedFixture({
                              ...selectedFixture,
                              x: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Y</label>
                        <input
                          type="number"
                          value={Math.round(selectedFixture.y)}
                          onChange={(e) =>
                            setSelectedFixture({
                              ...selectedFixture,
                              y: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Width</label>
                        <input
                          type="number"
                          value={Math.round(selectedFixture.width)}
                          onChange={(e) =>
                            setSelectedFixture({
                              ...selectedFixture,
                              width: parseFloat(e.target.value) || 30,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Height</label>
                        <input
                          type="number"
                          value={Math.round(selectedFixture.height)}
                          onChange={(e) =>
                            setSelectedFixture({
                              ...selectedFixture,
                              height: parseFloat(e.target.value) || 30,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleUpdateFixture}
                        className="flex-1 px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20"
                      >
                        Update
                      </button>
                      <button
                        onClick={handleDeleteFixture}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Single Table Properties */}
              {selectedTable && !selectedFixture && (
                <>
                  <h3
                    className="text-lg font-semibold text-[#3D3D3D] mb-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Table Properties
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Name</label>
                      <input
                        type="text"
                        value={selectedTable.name}
                        onChange={(e) =>
                          setSelectedTables([{ ...selectedTable, name: e.target.value }])
                        }
                        className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Seats</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={selectedTable.seats}
                        onChange={(e) =>
                          setSelectedTables([{
                            ...selectedTable,
                            seats: parseInt(e.target.value) || 1,
                          }])
                        }
                        className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3D3D3D] mb-1">
                        Shape
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227] bg-white"
                        value={selectedTable.shape}
                        onChange={(e) =>
                          setSelectedTables([{
                            ...selectedTable,
                            shape: e.target.value as "ROUND" | "RECTANGULAR",
                          }])
                        }
                      >
                        <option value="ROUND">Round</option>
                        <option value="RECTANGULAR">Rectangular</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleUpdateTable}
                        className="flex-1 px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20"
                      >
                        Update
                      </button>
                      <button
                        onClick={handleDeleteTable}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-xs text-[#6B6B6B]">
                      Position: ({Math.round(selectedTable.x)}, {Math.round(selectedTable.y)})
                    </p>
                  </div>
                </>
              )}

              {/* Multi-Table Properties */}
              {selectedTables.length > 1 && !selectedFixture && (
                <>
                  <h3
                    className="text-lg font-semibold text-[#3D3D3D] mb-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Multiple Tables
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[#6B6B6B]">
                      {selectedTables.length} tables selected
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTables([])}
                        className="flex-1 px-4 py-2 border border-[#E8D5A3] text-[#3D3D3D] rounded-lg hover:bg-[#F7E7CE]/50 transition-colors"
                      >
                        Deselect All
                      </button>
                      <button
                        onClick={handleDeleteTable}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        Delete All
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* No Selection */}
              {selectedTables.length === 0 && !selectedFixture && (
                <>
                  <h3
                    className="text-lg font-semibold text-[#3D3D3D] mb-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Properties
                  </h3>
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-[#E8D5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <p className="text-[#6B6B6B] text-sm">
                      Click a table or fixture to edit its properties
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Legend */}
            <div className="wedding-card rounded-xl p-4 mt-4">
              <h4 className="text-sm font-medium text-[#3D3D3D] mb-3">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#F7E7CE] border border-[#E8D5A3]"></div>
                  <span className="text-[#6B6B6B]">Table</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#C9A227] border border-[#B8922A]"></div>
                  <span className="text-[#6B6B6B]">Selected Table</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#9CAF88] border border-[#7A9568]"></div>
                  <span className="text-[#6B6B6B]">Fixture/Walkway</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Table Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Table"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1">Table Name</label>
            <input
              type="text"
              placeholder="e.g., Table 41"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-4 py-2 border border-[#E8D5A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 border border-[#E8D5A3] text-[#6B6B6B] rounded-lg hover:bg-[#F7E7CE]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTable}
              className="flex-1 px-4 py-2 bg-[#C9A227] hover:bg-[#B8922A] text-white rounded-lg transition-colors shadow-lg shadow-[#C9A227]/20"
            >
              Add Table
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
