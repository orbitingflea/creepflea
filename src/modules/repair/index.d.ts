interface RoomObjectCache {
  needRepair?: boolean;
}

interface Room {
  _repairerTasks?: WorkerTask[];
  _towerRepairTarget?: Structure | null;
}
