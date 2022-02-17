import { BodyWCM, BodyRepeat } from 'util.js';
import { id as idRoom2 } from './room2.js';
import { id as idRoom4 } from './room4.js';
import { GetStrongholdContainers } from 'skRoom.js';
import taskCommon from 'task.common.js';

const bodyOuterCarrier = BodyWCM(1, 21, 11);
const bodyOuterDigger = BodyWCM(12, 2, 7);

export default function ConfigList() {
    let confs = [];
    let conf;

    // 开采生物质
    confs.push({
        name: 'BiomassHarvester',
        role: 'outerHarvester',
        body: BodyWCM(26, 6, 16),
        require: 0,
        args: {
            sourceId: '61f31601bf9e8c28f04645bc',
            sourceRoom: 'E40S45',
            targetId: idRoom2.storage,
            earlyStop: 200,
        },
        spawn: ['Spawn1', 'Spawn1b', 'Spawn1c']
    });

    // ---------
    // SK Mining

    const room_sk = Game.rooms['E36S45'];

    confs.push({
        name: 'StrongholdAttacker_E36S45',
        role: 'skStrongholdAttacker',
        body: BodyRepeat([
            {type: TOUGH, num: 10},
            {type: MOVE, num: 10},
            {type: RANGED_ATTACK, num: 10},
            {type: HEAL, num: 20},
        ]),
        require: 0,
        args: {
            roomName: 'E36S45',
        },
        spawn: ['Spawn1', 'Spawn1b', 'Spawn1c'],
    });

    confs.push({
        name: 'SkRecycler_E36S45',
        role: 'skRecycler',
        body: BodyWCM(0, 10, 5),
        require: 0,
        args: {
            roomName: 'E36S45',
            sourceIdList: room_sk ? taskCommon.GetRecyclerTargets(room_sk).concat(GetStrongholdContainers(room_sk)) : [],
            targetId: idRoom4.storage,
        },
        spawn: ['Spawn4', 'Spawn4b']
    });

    confs.push({
        name: 'SKGuard_E36S45',
        role: 'skGuard',
        body: BodyRepeat([
            {type: MOVE, num: 25},
            {type: HEAL, num: 5},
            {type: RANGED_ATTACK, num: 20}]),
        require: roomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            hurtTolerance: 15
        },
        spawn: ['Spawn1', 'Spawn1b', 'Spawn1c'],
        liveThreshold: 200,
    });

    confs.push({
        name: 'OuterAttacker_E36S45',
        role: 'outerAttacker',
        body: BodyRepeat([
            {type: ATTACK, num: 20},
            {type: MOVE, num: 20},
        ]),
        require: roomDanger('E36S45') ? 0 : room_sk && (
            room_sk.functionalStructures.some(s => s.structureType !== STRUCTURE_KEEPER_LAIR &&
                s.owner && s.owner.username === 'Invader')
        ) ? 1 : 0,
        args: {
            roomName: 'E36S45'
        },
        spawn: ['Spawn1', 'Spawn1b', 'Spawn1c'],
    });

    // --- 生产单位

    conf = {
        name: 'OuterDigger_E36S45',
        role: 'outerDigger',
        body: bodyOuterDigger,
        require: roomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            workingPosition: [33, 37],
            sourceId: '5bbcaf169099fc012e63a233',
            retreatRoom: 'E37S45',
        },
        spawn: ['Spawn4', 'Spawn4b'],
        liveThreshold: 20,
    };
    confs.push(conf);

    conf = {
        name: 'OuterCarrier_E36S45',
        role: 'outerCarrier',
        body: bodyOuterCarrier,
        require: roomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            resourcePosition: [33, 37],
            targetId: idRoom4.storage,
            earlyStop: 100,
        },
        spawn: ['Spawn4', 'Spawn4b'],
        liveThreshold: 100,
    };
    confs.push(conf);

    conf = {
        name: 'OuterDigger_E36S45b',
        role: 'outerDigger',
        body: bodyOuterDigger,
        require: roomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            workingPosition: [11, 43],
            sourceId: '5bbcaf169099fc012e63a235',
            retreatRoom: 'E37S45',
        },
        spawn: ['Spawn4', 'Spawn4b'],
        liveThreshold: 20,
    };
    confs.push(conf);

    conf = {
        name: 'OuterCarrier_E36S45b',
        role: 'outerCarrier',
        body: bodyOuterCarrier,
        require: roomDanger('E36S45') ? 0 : 2,
        args: {
            roomName: 'E36S45',
            resourcePosition: [11, 43],
            targetId: idRoom4.storage,
            earlyStop: 100,
        },
        spawn: ['Spawn4', 'Spawn4b'],
        liveThreshold: 100,
    };
    confs.push(conf);

    conf = {
        name: 'OuterDigger_E36S45c',
        role: 'outerDigger',
        body: bodyOuterDigger,
        require: roomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            workingPosition: [42, 4],
            sourceId: '5bbcaf169099fc012e63a22e',
            retreatRoom: 'E37S45',
        },
        spawn: ['Spawn4', 'Spawn4b'],
        liveThreshold: 20,
    };
    confs.push(conf);

    conf = {
        name: 'OuterCarrier_E36S45c',
        role: 'outerCarrier',
        body: bodyOuterCarrier,
        require: roomDanger('E36S45') ? 0 : 2,
        args: {
            roomName: 'E36S45',
            resourcePosition: [42, 4],
            targetId: idRoom4.storage,
            earlyStop: 100,
        },
        spawn: ['Spawn4', 'Spawn4b'],
        liveThreshold: 100,
    };
    confs.push(conf);

    // ----------

    // add spawn info
    const spawnList = ['Spawn1', 'Spawn1b', 'Spawn1c'];
    for (let i = 0; i < confs.length; i++) {
        // confs[i].name = confs[i].name + commonSuffix;
        if (confs[i].spawn == null) confs[i].spawn = spawnList;
    }
    return confs;
}
