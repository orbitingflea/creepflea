function GetCollapseTime(obj) {
    let eff = obj.effects;
    // console.log(`[DEBUG] obj = ${obj}`);
    if (eff == null) return -1;
    for (let e of eff) {
        if (e.effect == EFFECT_COLLAPSE_TIMER) {
            return e.ticksRemaining;
        }
    }
    return -1;
}

/**
 * global.roomDanger, defined by ts service 'dangerInfo'
 */
export function RoomDanger(roomName) {
    return roomDanger(roomName);
}



export function GetStrongholdContainers(room) {
    return room.functionalStructures.filter(
        s => {
            if (!(s.structureType == STRUCTURE_CONTAINER && s.store.getUsedCapacity() > 0 && GetCollapseTime(s) >= 0)) return false;
            let ramp = s.pos.lookFor(LOOK_STRUCTURES).filter(t => t.structureType === STRUCTURE_RAMPART && !t.my);
            if (ramp.length > 0) return false;
            return true;
        }
    ).map((obj) => obj.id);
}


/**
 * must be called when visible
 * 返回一个 LAIR 潜在的危险区域的矩形
 */
export function GetDangerZone(lair) {
    if (lair.cache.dangerZone) return lair.cache.dangerZone;
    let dangerZone = lair.room.lairRegions.find(r => r.shape.contains(lair.pos));
    lair.cache.dangerZone = dangerZone.shape;
    return lair.cache.dangerZone;
}

export function IsDangerZoneActive(lair) {
    let dangerZone = lair.room.lairRegions.find(r => r.shape.contains(lair.pos));
    return dangerZone.active;
}
