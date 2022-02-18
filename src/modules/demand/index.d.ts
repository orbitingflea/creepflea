type Demand = {
  [resourceType in ResourceConstant | 'all']?: RoomObject[];
}

interface RoomObjectCache {
  needResourceIfBelow?: {[res in ResourceConstant | 'all']?: number}
  giveResourceIfAbove?: {[res in ResourceConstant | 'all']?: number}
}
