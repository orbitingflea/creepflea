import { Rectangle } from 'lib/rectangle';
export {};

declare global {
  interface Room {
    _scanDanger(): void;
    _scanLair(): void;

    danger: DangerInfo | null;
    _danger: DangerInfo | null | undefined;

    lairRegions: LairRegion[];
    _lairRegions?: LairRegion[];
  }

  interface RoomCache {
    lairRegionStaticInfo: {
      shape: Rectangle;
      lairId: Id<StructureKeeperLair>;
    }[];
  }

  interface RoomMemory {
    danger: DangerInfo | null;
  }

  interface DangerInfo {
    type: string;  // 'invader' | 'stronghold' | 'hostile'
    endTime: number;
  }

  interface LairRegion {
    active: boolean;
    shape: Rectangle;
    lair: StructureKeeperLair;
  }

  interface StructureKeeperLair {
    spawnSoon: boolean;
  }
}
