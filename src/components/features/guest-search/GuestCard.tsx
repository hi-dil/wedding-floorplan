import { Card } from "@/components/ui";
import { Guest, Table } from "@/types";

interface GuestCardProps {
  guest: Guest;
  table: Table | null;
}

export function GuestCard({ guest, table }: GuestCardProps) {
  return (
    <Card variant="highlighted" className="max-w-md mx-auto text-center">
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{guest.name}</h3>

      {table ? (
        <div className="space-y-2">
          <p className="text-lg text-gray-700">
            You are seated at <span className="font-bold text-emerald-600">{table.name}</span>
          </p>
          {guest.seatNumber && (
            <p className="text-gray-600">
              Seat <span className="font-semibold">{guest.seatNumber}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Your table is highlighted in green on the floor plan above
          </p>
        </div>
      ) : (
        <p className="text-gray-600">
          You have not been assigned to a table yet.
          <br />
          Please check with the event organizer.
        </p>
      )}
    </Card>
  );
}
