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
    lairRegionStaticInfo?: LairRegionStatic[];
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

  interface LairRegionStatic {
    shape: Rectangle;
    lairId: Id<StructureKeeperLair>;
  }

  interface StructureKeeperLair {
    spawnSoon: boolean;
  }

  interface RoomPosition {
    inLairRegion: boolean;
    inActiveLairRegion: boolean;
    lairRegion: LairRegion | null;
  }
}
