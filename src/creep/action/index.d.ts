interface Creep {
  _takeResource(sources: BlindObject[], resource: ResourceConstant | 'all', moveOnly: boolean): number;
  takeResource(
    from: RoomObject | Id<RoomObject> | BlindObject | (RoomObject | Id<RoomObject> | BlindObject)[],
    resource?: ResourceConstant | 'all',
    moveOnly?: boolean
  ): number;

  _runWorkerTasks(tasks: WorkerTask[], moveOnly: boolean): number;
  runWorkerTasks(tasks: WorkerTask | WorkerTask[], moveOnly?: boolean): number;

  _giveResource(targets: BlindObject[], resource: ResourceConstant | 'all', moveOnly: boolean): number;
  giveResource(
    targets: RoomObject | Id<RoomObject> | BlindObject | (RoomObject | Id<RoomObject> | BlindObject)[],
    resource?: ResourceConstant | 'all',
    moveOnly?: boolean
  ): number;
}

type WorkerTask = {
  id: Id<Structure>,
  roomName?: string,
  action: 'repair' | 'build' | 'upgrade',
  priority: number,
}
