export type DriverSeason = { year: number; team: string; number: string; position: number | null; points: number | null };
export type DriverArchive = {
  id: string; name: string; birthday: string | null; country: string; history: DriverSeason[];
  career: { starts: number | null; wins: number | null; podiums: number | null; poles: number | null; titles: number | null };
  championshipYears: number[];
};
export interface DriverRepository { load(id: string): Promise<{ profile: unknown; statistics: unknown }> }
export class DriverDataError extends Error {}
