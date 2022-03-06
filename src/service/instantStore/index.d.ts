export {}

declare global {
  interface Creep {
    // withdraw(): modified
    _withdraw?(target: Structure | Tombstone | Ruin, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode;
    // transfer(): modified
    _transfer?(target: Structure, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode;
    // pickup(): modified
    _pickup?(target: Resource<ResourceConstant>): -8 | CreepActionReturnCode;
    // move(): modified
    _move?(direction: DirectionConstant): CreepMoveReturnCode;
    _move?(target: Creep): OK | ERR_NOT_OWNER | ERR_BUSY | ERR_NOT_IN_RANGE | ERR_INVALID_ARGS;

    _worked?: boolean;
    _moved?: boolean;
  }

  const getCapacity: (store: StoreDefinition, resourceType?: ResourceConstant) => number;
  const getFreeCapacity: (store: StoreDefinition, resourceType?: ResourceConstant) => number;
  const getUsedCapacity: (store: StoreDefinition, resourceType?: ResourceConstant) => number;

  namespace NodeJS {
    interface Global {
      getCapacity: (store: StoreDefinition, resourceType?: ResourceConstant) => number;
      getFreeCapacity: (store: StoreDefinition, resourceType?: ResourceConstant) => number;
      getUsedCapacity: (store: StoreDefinition, resourceType?: ResourceConstant) => number;
    }
  }
}
