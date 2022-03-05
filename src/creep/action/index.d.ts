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

  takeResource2(sources: DemandItem[]): number;
  giveResource2(sinks: DemandItem[]): number;
}

type WorkerTask = {
  id: Id<Structure>,
  roomName?: string,
  action: 'repair' | 'build' | 'upgrade',
  priority: number,
}

type DemandItem = {
  obj: RoomObject | {id: Id<RoomObject>};
  roomName?: string;
  resType: ResourceConstant;  // do not use 'all', use true 顺路捎带
  amount: number;
};
