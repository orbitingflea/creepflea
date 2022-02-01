// This file builds the basic conf list for a specific room.
// It will automatically scan the room objects and generate needed confs.
// Executed every tick.
// WARN: Only for rooms with storage.
// names do not contain spawn & commonPrefix information.
/**
 * @param roomName
 * @param commonSuffix (only required to compute SOS information)
 * @returns confList
 */

import { BodyWCM, GetCreepCost } from 'util.js';
import { UpdateStructureStatus } from 'CarrierSystem.js';
import taskCommon from 'task.common.js';
import util from 'util.js';

function ConfForSource(room, sources, i, bodyCarrierForSource) {
    const source = sources[i];
    let confs = [];

    // find working position
    let workingPos = null;
    let flags = room.find(FIND_FLAGS, {
        filter: (flag) => {
            return (flag.pos.inRangeTo(source, 1));
        }
    });
    if (flags.length > 0) {
        workingPos = flags[0].pos;
    }

    let container;
    if (!workingPos) {
        let containers = room.containers.filter(s => s.pos.inRangeTo(source, 1));
        if (containers.length > 0) {
            container = containers[0];
            workingPos = container.pos;
        }
    }

    // three cases of mining
    if (!workingPos) {
        // basic mining
        confs.push({
            name: 'Digger' + i,
            role: 'basicHarvester',
            body: BodyWCM(5, 5, 5),
            require: 1,
            args: {
                sourceId: source.id,
                targetId: room.storage.id
            }
        });
        return confs;
    }

    // find links
    let links = room.links.filter(s => s.pos.inRangeTo(workingPos, 1));
    if (links.length > 0 && !links[0].isCenterLink) {
        // link mining
        let link = links[0];
        link.isSourceLink = true;
        confs.push({
            name: 'Digger' + i,
            role: 'diggerLink',
            body: BodyWCM(6, 2, 3),
            require: 1,
            args: {
                sourceId: source.id,
                linkId: link.id,
                roomName: room.name,
                workingPosition: [workingPos.x, workingPos.y]
            }
        });

        // run link logic
        let centerLink = room.centerLink;
        if (centerLink && centerLink.store[RESOURCE_ENERGY] == 0 && link.store[RESOURCE_ENERGY] >= 700) {
            if (!centerLink.gotEnergy) {
                centerLink.gotEnergy = true;
                link.transferEnergy(centerLink);
            }
        }
        return confs;
    }

    // container mining
    if (!container) {
        console.log(`ERROR impossible branch: No container found for source ${source.id} in room ${room.name}`);
        return [];
    }
    confs.push({
        name: 'Digger' + i,
        role: 'digger',
        body: BodyWCM(6, 0, 3),
        require: 1,
        args: {
            sourceId: source.id,
            containerId: container.id
        }
    });
    let needCarrier = 1;
    if (room.centerPos) {
        let centerPos = room.centerPos;
        if (centerPos.inRangeTo(container, 1)) {
            // ignore carrier, use central carrier instead
            needCarrier = 0;
        }
    }
    let containerFull = container.store.getFreeCapacity() == 0;
    let threshold = containerFull ? 20 : 0;
    let fromId = container.id;
    let resList = container.pos.lookFor(LOOK_RESOURCES).filter(r => r.resourceType == RESOURCE_ENERGY && r.amount > threshold);
    if (resList.length > 0) fromId = resList[0].id;
    confs.push({
        name: 'CarrierForSource' + i,
        role: 'carrier',
        body: bodyCarrierForSource,
        require: needCarrier,
        args: {
            sourceId: fromId,
            targetIdList: [room.storage.id]
        }
    });
    return confs;
}

function DesignStrongUpgrader(energy) {
    let body = [CARRY, CARRY];
    energy -= 100;
    while (energy >= 450 && body.length <= 45) {
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);
        body.push(MOVE);
        energy -= 450;
    }
    while (body.length <= 48 && energy >= 100) {
        body.push(CARRY);
        body.push(CARRY);
        energy -= 100;
    }
    return body;
}

function ConfForUpgrader(room) {
    const controller = room.controller;
    let confs = [];
    const containers = room.containers.filter(s => s.pos.inRangeTo(controller, 3));
    if (containers.length > 0) {
        const container = containers[0];
        let threshold = 300000;
        let body = BodyWCM(6, 2, 3);
        let useStrong = false;
        if (room.storage.store[RESOURCE_ENERGY] > threshold && room.controller.level < 8) {
            body = DesignStrongUpgrader(room.energyCapacityAvailable);
            useStrong = true;
        }
        confs.push({
            name: 'Upgrader',
            role: 'upgrader',
            body: body,
            require: 1,
            args: {
                containerId: container.id,
                controllerId: controller.id
            }
        });
        // mark container as containerNearController
        container.cache.isContainerNearController = true;

        confs.push({
            name: 'CarrierForUpgrader',
            role: 'carrier',
            body: BodyWCM(0, 8, 4),
            require: (useStrong),
            args: {
                sourceId: room.storage.id,
                targetIdList: [container.id]
            }
        });
        return confs;
    } else {
        // basic upgrader
        confs.push({
            name: 'Upgrader',
            role: 'basicUpgrader',
            body: BodyWCM(5, 5, 5),
            require: 1,
            args: {
                sourceId: room.storage.id,
                controllerId: controller.id
            }
        });
        return confs;
    }
}

function DesignMinerBody(energy) {
    let body = [];
    while (energy >= 450 && body.length <= 45) {
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);
        body.push(WORK);
        body.push(MOVE);
        energy -= 450;
    }
    if (body.length <= 48 && energy >= 150) {
        body.push(WORK);
        body.push(MOVE);
        energy -= 150;
        while (body.length < 50 && energy >= 100) {
            body.push(WORK);
            energy -= 100;
        }
    }
    return body;
}

function ConfForMiner(room) {
    const mineral = room.mineral;
    if (!mineral) return [];
    let confs = [];
    const containers = room.containers.filter(s => s.pos.inRangeTo(mineral, 1));
    // console.log(`INFO: ${room.name} has ${containers.length} containers for miner`);
    if (containers.length > 0) {
        const container = containers[0];
        let require = mineral.mineralAmount > 0 &&
            mineral.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR) ? 1 : 0;
        let body = DesignMinerBody(room.energyCapacityAvailable);
        confs.push({
            name: 'Miner',
            role: 'miner',
            body: body,
            require: require,
            args: {
                containerId: container.id,
                sourceId: mineral.id
            }
        });
        if (container.store.getUsedCapacity() >= 500) {
            for (let resourceType in container.store) {
                // if (resourceType == RESOURCE_ENERGY) continue;
                global.CarrierManager(room.name).NewTask(container.id, room.storage.id, resourceType);
            }
        }
    }
    return confs;
}

export default function BuildRoomList(roomName, commonSuffix, opts = {}) {
    const room = Game.rooms[roomName];
    if (!room) {
        return [];
    }
    UpdateStructureStatus(room);
    let confs = [];

    // default args
    let bodyCarrierFromStorage = BodyWCM(0, 10, 5);
    if (opts.bodyCarrierFromStorage) bodyCarrierFromStorage = opts.bodyCarrierFromStorage;
    let bodyCarrierForSource = BodyWCM(0, 10, 5);
    if (opts.bodyCarrierForSource) bodyCarrierForSource = opts.bodyCarrierForSource;
    let bodyWorker = BodyWCM(5, 5, 5);
    if (opts.bodyWorker) bodyWorker = opts.bodyWorker;
    let bodyRecycler = BodyWCM(0, 8, 4);
    if (opts.bodyRecycler) bodyRecycler = opts.bodyRecycler;
    let bodyCarrierCenter = BodyWCM(0, 8, 2);
    if (opts.bodyCarrierCenter) bodyCarrierCenter = opts.bodyCarrierCenter;

    // SOS & Main Carrier
    let needSosCarrier = room.NeedSOS('CarrierFromStorage' + commonSuffix, GetCreepCost(bodyCarrierFromStorage));
    let needSosHarvester = room.storage.store[RESOURCE_ENERGY] == 0 &&
        !room.myCreeps.some(c => c.memory.configName.indexOf('Digger') !== -1);
    confs.push({
        name: 'SosCarrier',
        role: 'carrier',
        body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
        args: {
            sourceId: room.storage.id,
            targetIdList: room.spawns.concat(room.extensions).map(s => s.id)
        },
        require: needSosCarrier ? 1 : 0
    });

    const sosSource = room.storage.pos.findClosestByRange(room.sources);
    confs.push({
        name: 'SosHarvester',
        role: 'basicHarvester',
        body: [WORK, CARRY, MOVE],
        args: {
            sourceId: sosSource.id,
            targetId: room.storage.id
        },
        require: needSosHarvester ? 1 : 0
    });

    confs.push({
        name: 'SosHarvesterBig',
        role: 'basicHarvester',
        body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
        args: {
            sourceId: sosSource.id,
            targetId: room.storage.id
        },
        require: needSosHarvester ? 1 : 0
    });

    confs.push({
        name: 'CarrierFromStorage',
        role: 'carrier',
        body: bodyCarrierFromStorage,
        require: 1,
        args: {
            sourceId: room.storage.id,
            targetIdList: room.functionalStructures.filter(
                (structure) => {
                    return (structure.hasCache && structure.cache.needEnergy);
                }
            ).map((obj) => obj.id)
        }
    });

    // Carrier Center
    const flags = room.find(FIND_FLAGS);
    let centerPos = null;
    for (let flag of flags) {
        if (flag.pos.inRangeTo(room.storage, 1)) {
            centerPos = flag.pos;
            break;
        }
    }
    if (centerPos) {
        // find a link
        room.centerPos = centerPos;
        let links = room.links.filter(s => s.pos.inRangeTo(centerPos, 1));
        if (links.length > 0) {
            let link = links[0];
            link.isCenterLink = true;
            room.centerLink = link;
            confs.push({
                name: 'CarrierCenter',
                role: 'carrierCenter',
                body: bodyCarrierCenter,
                require: 1,
                args: {
                    storageId: room.storage.id,
                    linkId: link.id,
                    workingPosition: [centerPos.x, centerPos.y]
                }
            });
        }
    }

    // Diggers
    const sources = room.sources;
    for (let i in sources) {
        confs = confs.concat(ConfForSource(room, sources, i, bodyCarrierForSource));
    }

    // Upgrader
    confs = confs.concat(ConfForUpgrader(room));

    // Recycler
    confs.push({
        name: 'Recycler',
        role: 'recycler',
        body: bodyRecycler,
        require: 1,
        args: {
            targetId: room.storage.id,
            sourceIdList: taskCommon.GetRecyclerTargets(room),
        }
    });

    // Worker
    let doUpgrade = room.controller.level < 8;
    let taskList = taskCommon.GetWorkerTasks(room, doUpgrade);
    confs.push({
        name: 'Worker',
        role: 'worker',
        body: bodyWorker,
        require: room.storage.store[RESOURCE_ENERGY] >= util.constant.storageSafeEnergy && taskList.length > 0 ? 1 : 0,
        args: {
            sourceId: room.storage.id,
            taskList: taskList
        }
    });

    // Miner
    confs = confs.concat(ConfForMiner(room));

    return confs;
}
