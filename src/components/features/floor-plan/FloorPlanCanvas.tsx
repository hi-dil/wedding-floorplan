"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Table, Fixture, Venue } from "@/types";
import { cn } from "@/utils/cn";
import { TABLE_COLORS, FIXTURE_COLORS } from "@/lib/constants";

interface FloorPlanCanvasProps {
  venue: Venue;
  tables: Table[];
  fixtures: Fixture[];
  highlightedTableId?: string | null;
  onTableClick?: (table: Table) => void;
  className?: string;
}

interface TouchState {
  scale: number;
  translateX: number;
  translateY: number;
}

export function FloorPlanCanvas({
  venue,
  tables,
  fixtures,
  highlightedTableId,
  onTableClick,
  className,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<TouchState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [fitScale, setFitScale] = useState<number>(1);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  // Touch gesture state refs
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastDragPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  // Calculate fit-to-container scale (fill the container)
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) return 1;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width || 400;
    const containerHeight = containerRect.height || 400;

    // The SVG viewBox scales proportionally, so we need to calculate
    // how much we need to scale to fill the container height
    // First, find the natural rendered height of the SVG at scale 1
    const aspectRatio = venue.width / venue.height;
    const naturalSvgHeight = containerWidth / aspectRatio;

    // Scale needed to make the SVG fill the container height
    const scaleToFillHeight = containerHeight / naturalSvgHeight;

    return Math.max(1, scaleToFillHeight);
  }, [venue.width, venue.height]);

  // Fit to container on mount and resize
  useEffect(() => {
    const updateFitScale = () => {
      const scale = calculateFitScale();
      setFitScale(scale);
      // Apply fit scale on initial load
      setTransform({ scale, translateX: 0, translateY: 0 });
    };

    // Initial calculation after a small delay to ensure container is rendered
    const timer = setTimeout(updateFitScale, 100);

    // Update on resize
    window.addEventListener("resize", updateFitScale);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateFitScale);
    };
  }, [calculateFitScale]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);

      if (lastTouchDistance.current > 0) {
        const scaleChange = newDistance / lastTouchDistance.current;

        setTransform(prev => {
          const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * scaleChange));

          // Adjust translation to zoom towards pinch center
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const centerX = newCenter.x - containerRect.left - containerRect.width / 2;
            const centerY = newCenter.y - containerRect.top - containerRect.height / 2;

            const scaleDiff = newScale / prev.scale;
            const newTranslateX = centerX - (centerX - prev.translateX) * scaleDiff;
            const newTranslateY = centerY - (centerY - prev.translateY) * scaleDiff;

            return {
              scale: newScale,
              translateX: newTranslateX,
              translateY: newTranslateY,
            };
          }

          return { ...prev, scale: newScale };
        });
      }

      lastTouchDistance.current = newDistance;
      lastTouchCenter.current = newCenter;
    } else if (e.touches.length === 1 && isDragging.current && transform.scale > 1) {
      // Pan when zoomed in beyond 100%
      const dx = e.touches[0].clientX - lastDragPos.current.x;
      const dy = e.touches[0].clientY - lastDragPos.current.y;

      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy,
      }));

      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [isPinching, transform.scale, fitScale]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsPinching(false);
    isDragging.current = false;
    lastTouchDistance.current = 0;
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * 1.3),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale / 1.3),
    }));
  }, []);

  // Reset to 100% (original scale)
  const handleReset = useCallback(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  // Fit to container
  const handleFitToContainer = useCallback(() => {
    const scale = calculateFitScale();
    setTransform({ scale, translateX: 0, translateY: 0 });
  }, [calculateFitScale]);

  // Table tap handler with visual feedback
  const handleTableTap = useCallback((table: Table, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // Visual feedback
    setActiveTableId(table.id);
    setTimeout(() => setActiveTableId(null), 300);

    onTableClick?.(table);
  }, [onTableClick]);

  // Mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isDragging.current = true;
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || transform.scale <= 1) return;

    const dx = e.clientX - lastDragPos.current.x;
    const dy = e.clientY - lastDragPos.current.y;

    setTransform(prev => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));

    lastDragPos.current = { x: e.clientX, y: e.clientY };
  }, [transform.scale]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setTransform(prev => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));

      // Zoom towards cursor position
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const cursorX = e.clientX - containerRect.left - containerRect.width / 2;
        const cursorY = e.clientY - containerRect.top - containerRect.height / 2;

        const scaleDiff = newScale / prev.scale;
        const newTranslateX = cursorX - (cursorX - prev.translateX) * scaleDiff;
        const newTranslateY = cursorY - (cursorY - prev.translateY) * scaleDiff;

        return {
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        };
      }

      return { ...prev, scale: newScale };
    });
  }, []);

  // Check if currently at fit scale
  const isAtFitScale = Math.abs(transform.scale - fitScale) < 0.01 && transform.translateX === 0 && transform.translateY === 0;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Zoom Controls - Elegant jewelry-like design */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8D5A3] shadow-lg shadow-[#C9A227]/10 flex items-center justify-center text-[#C9A227] hover:bg-[#F7E7CE] hover:border-[#C9A227] active:scale-95 transition-all duration-200"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8D5A3] shadow-lg shadow-[#C9A227]/10 flex items-center justify-center text-[#C9A227] hover:bg-[#F7E7CE] hover:border-[#C9A227] active:scale-95 transition-all duration-200"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
        <div className="h-px bg-[#E8D5A3] mx-2 my-0.5" />
        <button
          onClick={handleFitToContainer}
          className={cn(
            "w-9 h-9 rounded-full backdrop-blur-sm border shadow-lg shadow-[#C9A227]/10 flex items-center justify-center transition-all duration-200 active:scale-95",
            isAtFitScale
              ? "bg-[#C9A227] border-[#B8922A] text-white"
              : "bg-white/90 border-[#E8D5A3] text-[#C9A227] hover:bg-[#F7E7CE] hover:border-[#C9A227]"
          )}
          aria-label="Fit to screen"
          title="Fit to screen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
        <button
          onClick={handleReset}
          className={cn(
            "w-9 h-9 rounded-full backdrop-blur-sm border shadow-lg shadow-[#C9A227]/10 flex items-center justify-center transition-all duration-200 active:scale-95",
            transform.scale === 1 && transform.translateX === 0 && transform.translateY === 0
              ? "bg-[#C9A227] border-[#B8922A] text-white"
              : "bg-white/90 border-[#E8D5A3] text-[#C9A227] hover:bg-[#F7E7CE] hover:border-[#C9A227]"
          )}
          aria-label="Reset to 100%"
          title="Reset to 100%"
        >
          <span className="text-xs font-bold">1:1</span>
        </button>
      </div>

      {/* Zoom level indicator - Subtle pill */}
      <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8D5A3] shadow-sm">
        <span className="text-xs font-medium text-[#6B6B6B]">
          {Math.round(transform.scale * 100)}%
        </span>
      </div>

      {/* Mobile hint - Shows briefly on first load */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 md:hidden pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-[#3D3D3D]/70 backdrop-blur-sm text-white text-xs font-light animate-fade-out">
          Pinch to zoom
        </div>
      </div>

      {/* Main canvas container */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden bg-[#FFFEF7] rounded-xl border border-[#E8D5A3] touch-none select-none"
        style={{ minHeight: "400px", maxHeight: "70vh", cursor: transform.scale > 1 ? "grab" : "default" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          viewBox={`0 0 ${venue.width} ${venue.height}`}
          className="w-full h-auto"
          style={{
            minHeight: "400px",
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            transition: isPinching ? "none" : "transform 0.2s ease-out",
          }}
        >
          {/* SVG Definitions for effects */}
          <defs>
            {/* Glow filter for highlighted tables */}
            <filter id="tableGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#C9A227" floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Tap feedback glow */}
            <filter id="tapGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feFlood floodColor="#C9A227" floodOpacity="0.6" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle shadow for depth */}
            <filter id="tableShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3D3D3D" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Background - Wedding ivory */}
          <rect x="0" y="0" width={venue.width} height={venue.height} fill="#FFFEF7" />

          {/* Venue outline - Gold accent */}
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

          {/* Fixtures - Sage green for walkways */}
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
                style={{ pointerEvents: "none" }}
              >
                {fixture.name}
              </text>
            </g>
          ))}

          {/* Tables - Wedding themed with enhanced touch targets */}
          {tables.map((table) => {
            const isHighlighted = highlightedTableId === table.id;
            const isActive = activeTableId === table.id;
            const centerX = table.x + table.width / 2;
            const centerY = table.y + table.height / 2;
            const radius = Math.min(table.width, table.height) / 2;

            // Minimum touch target size (44px in SVG units, scaled by venue size)
            const minTouchRadius = Math.max(radius, 22);

            return (
              <g
                key={table.id}
                  onClick={(e) => handleTableTap(table, e)}
                  onTouchEnd={(e) => {
                    if (!isPinching && !isDragging.current) {
                      handleTableTap(table, e);
                    }
                  }}
                  style={{ cursor: onTableClick ? "pointer" : "default" }}
                  filter={isActive ? "url(#tapGlow)" : isHighlighted ? "url(#tableGlow)" : "url(#tableShadow)"}
                >
                {/* Invisible touch target - larger hit area */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={minTouchRadius + 10}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                />

                {/* Table shape */}
                {table.shape === "ROUND" ? (
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    fill={isHighlighted || isActive ? TABLE_COLORS.highlighted : TABLE_COLORS.default}
                    stroke={isHighlighted || isActive ? TABLE_COLORS.highlightedStroke : TABLE_COLORS.defaultStroke}
                    strokeWidth={isHighlighted || isActive ? 3 : 2}
                    className="transition-colors duration-200"
                  />
                ) : (
                  <rect
                    x={table.x}
                    y={table.y}
                    width={table.width}
                    height={table.height}
                    fill={isHighlighted || isActive ? TABLE_COLORS.highlighted : TABLE_COLORS.default}
                    stroke={isHighlighted || isActive ? TABLE_COLORS.highlightedStroke : TABLE_COLORS.defaultStroke}
                    strokeWidth={isHighlighted || isActive ? 3 : 2}
                    rx="4"
                    transform={`rotate(${table.rotation}, ${centerX}, ${centerY})`}
                    className="transition-colors duration-200"
                  />
                )}

                {/* Seats around the table - Blush pink */}
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

                {/* Table name - larger and bolder for visibility */}
                <text
                  x={centerX}
                  y={centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill={isHighlighted || isActive ? "#FFFFFF" : "#3D3D3D"}
                  style={{ pointerEvents: "none" }}
                  className="transition-colors duration-200"
                >
                  {table.name.replace("Table ", "")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fade-out {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-fade-out {
          animation: fade-out 3s ease-out forwards;
        }

        @keyframes table-tap {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        .animate-table-tap {
          animation: table-tap 0.3s ease-out;
        }

              `}</style>
    </div>
  );
}
