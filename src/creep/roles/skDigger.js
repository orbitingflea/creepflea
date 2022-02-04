/**
 * 本文件是对于 action 概念的实践，用在 SK Mining 中。
 * 它需要处理小撤退和大撤退
 * args 包含 roomName, workingPosition, sourceId, retreatRoom
 *
 * 先决条件 1：大撤退，当 RoomDanger
 */

import util from 'util.js';
import creepCommon from 'creep.common.js';
import { RoomDanger, GetDangerZone, IsDangerZoneActive } from 'skRoom.js';

const skWaitRange = 7;

function ExecuteAction(creep) {
    while (creep.cache.action != null) {
        let action = creep.cache.action;
        try {
            if (action.stop) {
                if (!action.stop(creep)) {
                    action.work(creep);
                    return true;
                }
            } else {
                // new version
                if (action.work(creep)) {
                    return true;
                }
            }
        } catch (e) {
            console.log(`[ERROR execute action fail]`);
            console.log(e.stack);
            // console.log(action.work);
            creep.cache.action = null;
            return false;
        }
        // action finish
        if (action.next) {
            creep.cache.action = action.next;
        } else {
            creep.cache.action = null;
        }
    }
    return false;
}



const WorkWithContainer = (sourceId, lairId, containerId) => creep => {
    let lair = lairId != null ? Game.getObjectById(lairId) : null;
    if (RoomDanger(creep.room.name) || lair && IsDangerZoneActive(lair)) return false;

    let container = Game.getObjectById(containerId);
    if (!container) return false;
    if (container.hits < container.hitsMax && creep.store[RESOURCE_ENERGY] >= creep.getActiveBodyparts(WORK)) {
        creep.repair(container);
        return true;
    }
    let full = container.store.getFreeCapacity() == 0;
    if (!full) {
        if (creep.collectEnergyOrDrop()) return true;
    }

    let source = Game.getObjectById(sourceId);
    creep.harvest(source);  // assert: source is visible
    return true;
}



const WorkWithSite = (sourceId, lairId, siteId) => creep => {
    let lair = lairId != null ? Game.getObjectById(lairId) : null;
    if (RoomDanger(creep.room.name) || lair && IsDangerZoneActive(lair)) return false;

    let site = Game.getObjectById(siteId);
    if (!site) return false;
    if (creep.store[RESOURCE_ENERGY] >= creep.getActiveBodyparts(WORK) * 5 || creep.getFreeCapacity() == 0) {
        creep.build(site);
        return true;
    }

    if (creep.collectEnergyOrDrop()) return true;

    let source = Game.getObjectById(sourceId);
    creep.harvest(source);  // assert: source is visible
    return true;
}



export default (args) => ({
    source: creep => {
        if (ExecuteAction(creep)) return false;

        console.log(`[DEBUG] NOT USING PREVIOUS ACTION`);

        // case 1: room danger
        if (RoomDanger(args.roomName)) {
            let action1 = {
                stop: creep => {
                    return (creep.room.name == args.retreatRoom &&
                        creep.pos.inRangeTo(25, 25, 20) &&
                        creep.pos.parkable) ||
                        !RoomDanger(args.roomName);
                },
                work: creep => {
                    creep.driveAvoidLair(new RoomPosition(25, 25, args.retreatRoom), {
                        range: 20,
                        offRoad: true
                    });
                }
            };
            let action2 = {
                stop: creep => {
                    return !RoomDanger(args.roomName);
                },
                work: creep => {}
            };
            action1.next = action2;
            creep.cache.action = action1;
            if (ExecuteAction(creep)) return false;
        }

        let workPos = new RoomPosition(...args.workingPosition, args.roomName);
        let lair = workPos.visible ? workPos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_KEEPER_LAIR
        }) : null;

        // case 2: source keeper exist or appear soon
        let region = workPos.lairRegion;
        let rect = region && region.active ? region.shape : null;
        if (rect) {
            let action2 = {
                work: creep => {},
                stop: creep => {
                    if (RoomDanger(args.roomName)) return true;
                    if (!IsDangerZoneActive(lair)) return true;
                    return false;
                }
            };

            if (creep.pos.inRangeTo(workPos, skWaitRange)) {
                let action1 = {
                    work: creep => {
                        creep.driveTo(workPos, {
                            range: skWaitRange,
                            offRoad: true,
                            dangerZone: rect
                        });
                    },
                    stop: creep => {
                        if (RoomDanger(args.roomName)) return true;
                        if (!IsDangerZoneActive(lair)) return true;
                        return creep.pos.matchDestination(workPos, {
                            range: skWaitRange,
                            offRoad: true,
                            dangerZone: rect
                        });
                    }
                };
                action1.next = action2;
                creep.cache.action = action1;
                if (creep.pos.isEqualTo(workPos)) {
                    creep.drop(RESOURCE_ENERGY);
                }
                ExecuteAction(creep);
                return false;
            } else {
                let action1 = {
                    work: creep => {
                        creep.driveAvoidLair(workPos, {
                            range: skWaitRange,
                            offRoad: true,
                        });
                    },
                    stop: creep => {
                        if (RoomDanger(args.roomName)) return true;
                        if (!IsDangerZoneActive(lair)) return true;
                        return creep.pos.matchDestination(workPos, {
                            range: skWaitRange,
                            offRoad: true,
                            dangerZone: rect
                        });
                    }
                };
                action1.next = action2;
                creep.cache.action = action1;
                ExecuteAction(creep);
                return false;
            }
        }

        // case 3: move to workPos
        if (!creep.pos.isEqualTo(workPos)) {
            let action = {
                work: creep => {
                    creep.driveTo(workPos, {range: 0});
                },
                stop: creep => {
                    if (RoomDanger(args.roomName)) return true;
                    if (lair && IsDangerZoneActive(lair)) return true;
                    return creep.pos.isEqualTo(workPos);
                }
            };
            creep.cache.action = action;
            ExecuteAction(creep);
            return false;
        }

        // case 4
        let lairId = lair ? lair.id : null;
        let sourceId = args.sourceId;
        let container = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType == STRUCTURE_CONTAINER);
        if (container) {
            let action = {
                work: WorkWithContainer(sourceId, lairId, container.id)
            };
            creep.cache.action = action;
            ExecuteAction(creep);
            return false;
        }
        let site = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType == STRUCTURE_CONTAINER);
        if (site) {
            let action = {
                work: WorkWithSite(sourceId, lairId, site.id)
            };
            creep.cache.action = action;
            ExecuteAction(creep);
            return false;
        } else {
            creep.room.createConstructionSite(workPos, STRUCTURE_CONTAINER);
            creep.harvest(source);
            return false;
        }
    },

    target: creep => {
        return true;
    },
})
