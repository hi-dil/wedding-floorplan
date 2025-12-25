export type TableShape = "ROUND" | "RECTANGULAR" | "OVAL";
export type FixtureType = "STAGE" | "CATERER" | "ENTRANCE" | "WALKWAY" | "CUSTOM";

export interface Venue {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  shape: TableShape;
  rotation: number;
  venueId: string;
  guests?: Guest[];
  _count?: {
    guests: number;
  };
  _sum?: {
    pax: number | null;
  };
}

export interface Fixture {
  id: string;
  name: string;
  type: FixtureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string | null;
  venueId: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  pax: number;
  seatNumber: number | null;
  tableId: string | null;
  table?: Table | null;
}

export interface FloorPlanData {
  venue: Venue;
  tables: Table[];
  fixtures: Fixture[];
}

export interface SearchResult {
  guest: Guest;
  table: Table | null;
}
