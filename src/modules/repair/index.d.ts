interface RoomObjectCache {
  needRepair?: boolean;
}

type RepairerTask = {
  targetId: Id<Structure>,
  action: 'repair',
  priority: number,
}

interface Room {
  _repairerTasks?: RepairerTask[];
  _towerRepairTarget?: Structure | null;
}
