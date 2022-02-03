import { Rectangle } from 'lib/rectangle';

const SAFE_RANGE = 4;
const SPAWN_SOON_PREJUDGE_TICKS = 10;

Object.defineProperty(Room.prototype, 'lairRegions', {
  get: function(): LairRegion[] {
    if (this._lairRegions === undefined) this._scanLair();
    return this._lairRegions;
  }
});

Room.prototype._scanLair = function() {
  if (this.cache.lairRegionStaticInfo === undefined) {
    let info: {
      shape: Rectangle;
      lairId: Id<StructureKeeperLair>;
    }[] = [];
    // create static lair info

    let lairList: StructureKeeperLair[] = this.functionalStructures.filter(s => s.structureType === STRUCTURE_KEEPER_LAIR) as StructureKeeperLair[];
    if (lairList.length === 0) {
      this.cache.lairRegionStaticInfo = [];
      this._lairRegions = [];
      return;
    }

    let sourceList: (Source | Mineral)[] = this.sources;
    if (this.mineral) {
      sourceList.push(this.mineral);
    } else {
      console.log(`[WARN] impossible branch in In Room.prototype._scanLair()
- create static lair info (in cache)
- mineral does not found
- room: ${this.name}`);
    }

    for (let lair of lairList) {
      let pos1 = lair.pos;
      let pos2: RoomPosition | undefined = pos1.findClosestByRange(sourceList)?.pos;
      if (pos2 === undefined) {
        console.log(`[WARN] impossible branch in In Room.prototype._scanLair()
- create static lair info (in cache)
- findClosestByRange() return undefined
- room: ${this.name}`);
        continue;
      }
      let xl = Math.max(Math.min(pos1.x, pos2.x) - SAFE_RANGE, 0);
      let xr = Math.min(Math.max(pos1.x, pos2.x) + SAFE_RANGE, 49);
      let yl = Math.max(Math.min(pos1.y, pos2.y) - SAFE_RANGE, 0);
      let yr = Math.min(Math.max(pos1.y, pos2.y) + SAFE_RANGE, 49);
      info.push({
        shape: new Rectangle(xl, xr, yl, yr, this.name),
        lairId: lair.id
      });
    }

    this.cache.lairRegionStaticInfo = info;
  }

  let lairRegionList: LairRegion[] = [];
  let keepers = this.keepers;
  for (let info of this.cache.lairRegionStaticInfo) {
    let lair = Game.getObjectById(info.lairId) as StructureKeeperLair;
    let active = lair.spawnSoon;
    if (!active) {
      for (let keeper of keepers) {
        if (info.shape.contains(keeper.pos)) {
          active = true;
          break;
        }
      }
    }
    lairRegionList.push({
      active,
      shape: info.shape,
      lair
    });
  }

  this._lairRegions = lairRegionList;
};

Object.defineProperty(StructureKeeperLair.prototype, 'spawnSoon', {
  get: function(): boolean {
    let foo = (this as StructureKeeperLair).ticksToSpawn;
    return foo !== undefined && foo < SPAWN_SOON_PREJUDGE_TICKS;
  }
});
