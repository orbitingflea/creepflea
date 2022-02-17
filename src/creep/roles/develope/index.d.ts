interface WorkerArgs {
  sources: (BlindObject | Id<RoomObject>) | (BlindObject | Id<RoomObject>)[];
  tasks: WorkerTask | WorkerTask[];
  deathBehavior?: DeathBehavior;
}

interface DeathBehavior {
  threshold: number;
  action: 'none' | 'save';
  saveId?: Id<Structure>;
}

interface CreepCache {

}
