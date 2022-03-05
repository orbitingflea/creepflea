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
