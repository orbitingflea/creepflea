interface DeathBehavior {
  threshold: number;
  action: 'none' | 'save';
  saveId?: Id<Structure>;
}

interface WorkerArgs {
  sources: (BlindObject | Id<RoomObject> | RoomObject) | (BlindObject | Id<RoomObject> | RoomObject)[];
  tasks: WorkerTask | WorkerTask[];
  deathBehavior?: DeathBehavior;
}

interface CarrierArgs {
  sources: {[type in ResourceConstant | 'all']?: (BlindObject | Id<RoomObject> | RoomObject)[] | (BlindObject | Id<RoomObject> | RoomObject)};
  sinks: {[type in ResourceConstant | 'all']?: (BlindObject | Id<RoomObject> | RoomObject)[] | (BlindObject | Id<RoomObject> | RoomObject)};
  deathBehavior?: DeathBehavior;
}

type EnsureArray<T> = T | T[];

interface CarrierArgs2 {
  sources: EnsureArray<DemandItemP>;
  sinks: EnsureArray<DemandItemP>;
  deathBehavior?: DeathBehavior;
}

interface DemandItemP extends DemandItem {
  priority?: number;
}

interface Creep {
  _thisTickTakeResource?: ResourceConstant | 'all';
}

interface CreepCache {

}
