"use client";

import { useState, useRef, useEffect } from "react";
import { exportFloorPlanToPdf, PdfExportData } from "@/utils/pdfExport";
import { Table, Fixture, Venue, Guest } from "@/types";
import { TABLE_COLORS, FIXTURE_COLORS } from "@/lib/constants";

interface TableWithGuests extends Table {
  guests: Guest[];
}

interface ExportData {
  id: string;
  name: string;
  width: number;
  height: number;
  tables: TableWithGuests[];
  fixtures: Fixture[];
}

interface ExportPdfButtonProps {
  className?: string;
}

// Simple static floor plan renderer for PDF export
function StaticFloorPlan({
  venue,
  tables,
  fixtures,
}: {
  venue: Venue;
  tables: TableWithGuests[];
  fixtures: Fixture[];
}) {
  return (
    <svg
      viewBox={`0 0 ${venue.width} ${venue.height}`}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFEF7",
      }}
    >
      {/* Background */}
      <rect x="0" y="0" width={venue.width} height={venue.height} fill="#FFFEF7" />

      {/* Venue outline */}
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
      {fixtures.map((fixture) => (
        <g key={fixture.id}>
          <rect
            x={fixture.x}
            y={fixture.y}
            width={fixture.width}
            height={fixture.height}
            fill={fixture.color || FIXTURE_COLORS.WALKWAY}
            stroke="#7A9568"
            strokeWidth="1"
            rx="4"
            transform={`rotate(${fixture.rotation}, ${fixture.x + fixture.width / 2}, ${fixture.y + fixture.height / 2})`}
          />
          <text
            x={fixture.x + fixture.width / 2}
            y={fixture.y + fixture.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="600"
            fill="#3D3D3D"
          >
            {fixture.name}
          </text>
        </g>
      ))}

      {/* Tables */}
      {tables.map((table) => {
        const centerX = table.x + table.width / 2;
        const centerY = table.y + table.height / 2;
        const radius = Math.min(table.width, table.height) / 2;
        const occupiedSeats = table._sum?.pax || 0;

        return (
          <g key={table.id}>
            {/* Table shape */}
            {table.shape === "ROUND" ? (
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill={TABLE_COLORS.default}
                stroke={TABLE_COLORS.defaultStroke}
                strokeWidth="2"
              />
            ) : (
              <rect
                x={table.x}
                y={table.y}
                width={table.width}
                height={table.height}
                fill={TABLE_COLORS.default}
                stroke={TABLE_COLORS.defaultStroke}
                strokeWidth="2"
                rx="4"
                transform={`rotate(${table.rotation}, ${centerX}, ${centerY})`}
              />
            )}

            {/* Seats around the table */}
            {table.shape === "ROUND" &&
              Array.from({ length: table.seats }).map((_, i) => {
                const angle = (i * 360) / table.seats - 90;
                const seatRadius = radius + 12;
                const seatX = centerX + seatRadius * Math.cos((angle * Math.PI) / 180);
                const seatY = centerY + seatRadius * Math.sin((angle * Math.PI) / 180);
                const isOccupied = i < occupiedSeats;
                return (
                  <circle
                    key={i}
                    cx={seatX}
                    cy={seatY}
                    r="6"
                    fill={isOccupied ? "#C9A227" : "#F5E1DA"}
                    stroke={isOccupied ? "#B8922A" : "#E8D5A3"}
                    strokeWidth="1"
                  />
                );
              })}

            {/* Table name */}
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="700"
              fill="#3D3D3D"
            >
              {table.name.replace("Table ", "")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ExportPdfButton({ className }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // When export data is loaded and component is ready, generate PDF
  useEffect(() => {
    if (!exportData || !isReady) return;

    const generatePdf = async () => {
      try {
        const floorPlanElement = floorPlanRef.current;
        if (!floorPlanElement) {
          throw new Error("Floor plan element not found");
        }

        const pdfData: PdfExportData = {
          tables: exportData.tables,
          eventTitle: "Wedding Floor Plan",
        };

        // Generate and download PDF
        await exportFloorPlanToPdf(floorPlanElement, pdfData);
      } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export PDF. Please try again.");
      } finally {
        setIsExporting(false);
        setExportData(null);
        setIsReady(false);
      }
    };

    generatePdf();
  }, [exportData, isReady]);

  const handleExport = async () => {
    setIsExporting(true);
    setIsReady(false);

    try {
      // Fetch export data
      const response = await fetch("/api/export");
      if (!response.ok) {
        throw new Error("Failed to fetch export data");
      }

      const data: ExportData = await response.json();
      setExportData(data);

      // Wait for floor plan to render
      setTimeout(() => {
        setIsReady(true);
      }, 1000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF. Please try again.");
      setIsExporting(false);
      setExportData(null);
    }
  };

  const venue: Venue | null = exportData
    ? {
        id: exportData.id,
        name: exportData.name,
        width: exportData.width,
        height: exportData.height,
      }
    : null;

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`text-sm text-[#6B6B6B] hover:text-[#C9A227] transition-colors flex items-center gap-1 disabled:opacity-50 ${className || ""}`}
      >
        {isExporting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export PDF
          </>
        )}
      </button>

      {/* Hidden container for floor plan rendering - positioned off-screen but visible */}
      {exportData && venue && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: "0",
            width: `${venue.width}px`,
            height: `${venue.height}px`,
            backgroundColor: "#FFFEF7",
            overflow: "visible",
          }}
          aria-hidden="true"
        >
          <div
            ref={floorPlanRef}
            style={{
              width: `${venue.width}px`,
              height: `${venue.height}px`,
              backgroundColor: "#FFFEF7",
            }}
          >
            <StaticFloorPlan
              venue={venue}
              tables={exportData.tables}
              fixtures={exportData.fixtures}
            />
          </div>
        </div>
      )}
    </>
  );
}
