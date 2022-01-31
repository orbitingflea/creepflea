RoomPosition.prototype.getLairRegion = function() {
    if (!this.visible) return null;
    let lair = this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
    });
    if (!lair) return null;
    return lair.dangerZone;
}



RoomPosition.prototype.getActiveLairRegion = function() {
    if (!this.visible) return null;
    let lair = this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
    });
    if (!lair || !lair.isDangerZoneActive) return null;
    return lair.dangerZone;
}



Object.defineProperty(RoomPosition.prototype, 'inActiveLairRegion', {
    configurable: true,
    get: function() {
        if (!this.visible) return false;
        let lair = this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
        });
        if (!lair || !lair.isDangerZoneActive) return false;
        return lair.dangerZone.contains(this);
    }
});
