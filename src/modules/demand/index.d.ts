type Demand = {
  [resourceType in ResourceConstant | 'all']?: RoomObject[];
}

interface Structure {
  demand: Demand;
}

interface Room {
}
