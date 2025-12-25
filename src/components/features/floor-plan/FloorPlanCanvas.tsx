"use client";

import { Table, Fixture, Venue } from "@/types";
import { cn } from "@/utils/cn";
import { TABLE_COLORS } from "@/lib/constants";

interface FloorPlanCanvasProps {
  venue: Venue;
  tables: Table[];
  fixtures: Fixture[];
  highlightedTableId?: string | null;
  onTableClick?: (table: Table) => void;
  className?: string;
}

export function FloorPlanCanvas({
  venue,
  tables,
  fixtures,
  highlightedTableId,
  onTableClick,
  className,
}: FloorPlanCanvasProps) {
  return (
    <div className={cn("w-full overflow-auto bg-gray-100 rounded-xl", className)}>
      <svg
        viewBox={`0 0 ${venue.width} ${venue.height}`}
        className="w-full h-auto min-h-[400px]"
        style={{ maxHeight: "70vh" }}
      >
        {/* Background */}
        <rect x="0" y="0" width={venue.width} height={venue.height} fill="#f8fafc" />

        {/* Venue outline */}
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
        {fixtures.map((fixture) => (
          <g key={fixture.id}>
            <rect
              x={fixture.x}
              y={fixture.y}
              width={fixture.width}
              height={fixture.height}
              fill={fixture.color || "#94a3b8"}
              stroke="#64748b"
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
              fill="#374151"
              style={{ pointerEvents: "none" }}
            >
              {fixture.name}
            </text>
          </g>
        ))}

        {/* Tables */}
        {tables.map((table) => {
          const isHighlighted = highlightedTableId === table.id;
          const centerX = table.x + table.width / 2;
          const centerY = table.y + table.height / 2;
          const radius = Math.min(table.width, table.height) / 2;

          return (
            <g
              key={table.id}
              onClick={() => onTableClick?.(table)}
              style={{ cursor: onTableClick ? "pointer" : "default" }}
              className={cn(isHighlighted && "animate-pulse")}
            >
              {table.shape === "ROUND" ? (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill={isHighlighted ? TABLE_COLORS.highlighted : TABLE_COLORS.default}
                  stroke={isHighlighted ? "#16a34a" : "#d97706"}
                  strokeWidth={isHighlighted ? 3 : 2}
                />
              ) : (
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill={isHighlighted ? TABLE_COLORS.highlighted : TABLE_COLORS.default}
                  stroke={isHighlighted ? "#16a34a" : "#d97706"}
                  strokeWidth={isHighlighted ? 3 : 2}
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

              {/* Table name */}
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
  );
}
