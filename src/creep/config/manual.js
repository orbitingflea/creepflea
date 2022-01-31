import { BodyWCM, BodyRepeat } from '@/util.js';
import { id as idRoom1 } from './room1.js';
import { id as idRoom2 } from './room2.js';
import { id as idRoom4 } from './room4.js';
import taskCommon from '@/task.common.js';
import { RoomDanger, GetStrongholdContainers } from '../../skRoom.js';

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
        spawn: ['Spawn1', 'Spawn1b']
    });

    // ---------
    // SK Mining

    confs.push({
        name: 'StrongholdAttacker_E36S45',
        role: 'skStrongholdAttacker',
        body: BodyRepeat([
            {type: TOUGH, num: 4},
            {type: MOVE, num: 19},
            {type: RANGED_ATTACK, num: 10},
            {type: HEAL, num: 5},
        ]),
        require: 0,
        args: {
            roomName: 'E36S45',
        },
        spawn: ['Spawn1', 'Spawn1b'],
    });

    confs.push({
        name: 'SKGuard_E36S45',
        role: 'skGuard',
        body: BodyRepeat([
            {type: MOVE, num: 25},
            {type: HEAL, num: 5},
            {type: RANGED_ATTACK, num: 20}]),
        require: RoomDanger('E36S45') ? 0 : 2,
        args: {
            roomName: 'E36S45',
            hurtTolerance: 15
        },
        spawn: ['Spawn1', 'Spawn1b'],
        liveThreshold: 200,
    });

    const room_sk = Game.rooms['E36S45'];
    confs.push({
        name: 'OuterAttacker_E36S45',
        role: 'outerAttacker',
        body: BodyRepeat([
            {type: ATTACK, num: 20},
            {type: MOVE, num: 20},
        ]),
        require: RoomDanger('E36S45') ? 0 : room_sk && room_sk.findHostileStructures().length > 0 ? 1 : 0,
        args: {
            roomName: 'E36S45'
        },
        spawn: ['Spawn1', 'Spawn1b'],
    });

    // --- 生产单位

    conf = {
        name: 'OuterDigger_E36S45',
        role: 'skDigger',
        body: bodyOuterDigger,
        require: RoomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            workingPosition: [33, 37],
            sourceId: '5bbcaf169099fc012e63a233',
            retreatRoom: 'E37S45',
        },
        spawn: ['Spawn4'],
        liveThreshold: 20,
    };
    confs.push(conf);

    conf = {
        name: 'OuterCarrier_E36S45',
        role: 'outerCarrier',
        body: bodyOuterCarrier,
        require: RoomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            resourcePosition: [33, 37],
            targetId: idRoom4.storage,
            earlyStop: 100,
        },
        spawn: ['Spawn4'],
        liveThreshold: 100,
    };
    confs.push(conf);

    conf = {
        name: 'OuterDigger_E36S45b',
        role: 'outerDigger',
        body: bodyOuterDigger,
        require: RoomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            workingPosition: [11, 43],
            sourceId: '5bbcaf169099fc012e63a235',
            retreatRoom: 'E37S45',
        },
        spawn: ['Spawn4'],
        liveThreshold: 20,
    };
    confs.push(conf);

    conf = {
        name: 'OuterCarrier_E36S45b',
        role: 'outerCarrier',
        body: bodyOuterCarrier,
        require: RoomDanger('E36S45') ? 0 : 2,
        args: {
            roomName: 'E36S45',
            resourcePosition: [11, 43],
            targetId: idRoom4.storage,
            earlyStop: 100,
        },
        spawn: ['Spawn4'],
        liveThreshold: 100,
    };
    confs.push(conf);

    conf = {
        name: 'OuterDigger_E36S45c',
        role: 'outerDigger',
        body: bodyOuterDigger,
        require: RoomDanger('E36S45') ? 0 : 1,
        args: {
            roomName: 'E36S45',
            workingPosition: [42, 4],
            sourceId: '5bbcaf169099fc012e63a22e',
            retreatRoom: 'E37S45',
        },
        spawn: ['Spawn4'],
        liveThreshold: 20,
    };
    confs.push(conf);

    conf = {
        name: 'OuterCarrier_E36S45c',
        role: 'outerCarrier',
        body: bodyOuterCarrier,
        require: RoomDanger('E36S45') ? 0 : 2,
        args: {
            roomName: 'E36S45',
            resourcePosition: [42, 4],
            targetId: idRoom4.storage,
            earlyStop: 100,
        },
        spawn: ['Spawn4'],
        liveThreshold: 100,
    };
    confs.push(conf);

    // ----------

    conf = {
        name: 'SpecialCarrier',
        role: 'carrier',
        body: BodyWCM(0, 20, 10),
        require: 0,
        args: {
            sourceId: idRoom4.storage,
            targetIdList: [idRoom1.storage]
        },
        spawn: ['Spawn4'],
        liveThreshold: 20,
    };
    confs.push(conf);

    // ----------

    // add spawn info
    const spawnList = ['Spawn1', 'Spawn1b'];
    for (let i = 0; i < confs.length; i++) {
        // confs[i].name = confs[i].name + commonSuffix;
        if (confs[i].spawn == null) confs[i].spawn = spawnList;
    }
    return confs;
}