type Demand = {
  [resourceType in ResourceConstant | 'all']?: RoomObject[];
}

interface RoomObjectCache {
  needResourceIfBelow?: {[res in ResourceConstant]?: number}
  giveResourceIfAbove?: {[res in ResourceConstant]?: number}
}
