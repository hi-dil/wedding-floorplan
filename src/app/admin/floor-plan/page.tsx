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
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="1"
        style={{ cursor: cursorMap[h.id] }}
        onMouseDown={(e) => handleResizeMouseDown(e, fixture, h.id)}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>No venue found</p>
      </div>
    );
  }

  const selectedTable = selectedTables.length === 1 ? selectedTables[0] : null;

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
              <h1 className="text-2xl font-bold text-gray-900">Floor Plan Editor</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowAddModal(true)}>
                Add Table
              </Button>
              <Button onClick={handleSavePositions} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Floor Plan Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Click to select. Ctrl+click for multi-select. Drag to move.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectRow}
                    disabled={selectedTables.length === 0}
                  >
                    Select Row
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectColumn}
                    disabled={selectedTables.length === 0}
                  >
                    Select Column
                  </Button>
                </div>
              </div>
              <div className="overflow-auto bg-gray-50 rounded-lg">
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
                  <rect x="0" y="0" width={venue.width} height={venue.height} fill="#f8fafc" />
                  <rect
                    x="10"
                    y="10"
                    width={venue.width - 20}
                    height={venue.height - 20}
                    fill="none"
                    stroke="#cbd5e1"
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
                          fill={fixture.color || "#94a3b8"}
                          stroke={isSelected ? "#3b82f6" : "#64748b"}
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
                          fill="#374151"
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
                            fill={isSelected ? "#22c55e" : "#f5a623"}
                            stroke={isSelected ? "#16a34a" : "#d97706"}
                            strokeWidth={isSelected ? 3 : 2}
                          />
                        ) : (
                          <rect
                            x={table.x}
                            y={table.y}
                            width={table.width}
                            height={table.height}
                            fill={isSelected ? "#22c55e" : "#f5a623"}
                            stroke={isSelected ? "#16a34a" : "#d97706"}
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
                                fill="#e5e7eb"
                                stroke="#9ca3af"
                                strokeWidth="1"
                              />
                            );
                          })}
                        <text
                          x={centerX}
                          y={centerY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="#ffffff"
                          style={{ pointerEvents: "none" }}
                        >
                          {table.name.replace("Table ", "")}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>
          </div>

          {/* Properties Panel */}
          <div className="lg:col-span-1">
            <Card>
              {/* Fixture Properties */}
              {selectedFixture && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Fixture Properties</h3>
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      value={selectedFixture.name}
                      onChange={(e) =>
                        setSelectedFixture({ ...selectedFixture, name: e.target.value })
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="X"
                        type="number"
                        value={Math.round(selectedFixture.x)}
                        onChange={(e) =>
                          setSelectedFixture({
                            ...selectedFixture,
                            x: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <Input
                        label="Y"
                        type="number"
                        value={Math.round(selectedFixture.y)}
                        onChange={(e) =>
                          setSelectedFixture({
                            ...selectedFixture,
                            y: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Width"
                        type="number"
                        value={Math.round(selectedFixture.width)}
                        onChange={(e) =>
                          setSelectedFixture({
                            ...selectedFixture,
                            width: parseFloat(e.target.value) || 30,
                          })
                        }
                      />
                      <Input
                        label="Height"
                        type="number"
                        value={Math.round(selectedFixture.height)}
                        onChange={(e) =>
                          setSelectedFixture({
                            ...selectedFixture,
                            height: parseFloat(e.target.value) || 30,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleUpdateFixture}>
                        Update
                      </Button>
                      <Button variant="danger" onClick={handleDeleteFixture}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Single Table Properties */}
              {selectedTable && !selectedFixture && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Table Properties</h3>
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      value={selectedTable.name}
                      onChange={(e) =>
                        setSelectedTables([{ ...selectedTable, name: e.target.value }])
                      }
                    />
                    <Input
                      label="Seats"
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
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shape
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleUpdateTable}>
                        Update
                      </Button>
                      <Button variant="danger" onClick={handleDeleteTable}>
                        Delete
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Position: ({Math.round(selectedTable.x)}, {Math.round(selectedTable.y)})
                    </p>
                  </div>
                </>
              )}

              {/* Multi-Table Properties */}
              {selectedTables.length > 1 && !selectedFixture && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Multiple Tables</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {selectedTables.length} tables selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setSelectedTables([])}
                      >
                        Deselect All
                      </Button>
                      <Button variant="danger" onClick={handleDeleteTable}>
                        Delete All
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* No Selection */}
              {selectedTables.length === 0 && !selectedFixture && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Properties</h3>
                  <p className="text-gray-500 text-sm">
                    Click a table or fixture to edit its properties
                  </p>
                </>
              )}
            </Card>
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
          <Input
            label="Table Name"
            placeholder="e.g., Table 41"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTable}>Add Table</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
