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

interface Creep {
  _thisTickTakeResource?: ResourceConstant | 'all';
}

interface CreepCache {

}
