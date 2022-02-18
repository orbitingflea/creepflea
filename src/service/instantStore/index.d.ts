interface Creep {
  // withdraw(): modified
  _withdraw?(target: Structure | Tombstone | Ruin, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode;
  // transfer(): modified
  _transfer?(target: Structure, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode;
}
