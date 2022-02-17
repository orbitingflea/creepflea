// must spawn from a room with RCL >= 6
import { BodyWCM, GetCreepCost } from 'util.js';
import { UpdateStructureStatus } from 'CarrierSystem.js';
import taskCommon from 'task.common.js';
import { id as idRoom1 } from './room1.js';
import { id as idRoom3 } from './room3.js';

const bodyOuterWorker = BodyWCM(10, 8, 18);
const bodyOuterDigger = BodyWCM(6, 1, 3);
const bodyOuterCarrier = BodyWCM(1, 15, 8);
const bodyOuterDefender = [
    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    HEAL, HEAL, HEAL, HEAL,
    ATTACK, ATTACK, ATTACK, ATTACK
];
const bodyOuterAttacker = [
    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK
];

export default function ConfigList() {
    let confs = [];

    const sourceInfo = [
        {
            roomName: 'E38S46',
            workingPosition: [24, 18],
            bodyCarrier: BodyWCM(1, 15, 8),
            targetId: idRoom1.link_left,
            baseRoomName: 'E38S45',
        },
        {
            roomName: 'E37S46',
            workingPosition: [43, 36],
            bodyCarrier: BodyWCM(1, 32, 17),
            targetId: idRoom1.link_left,
            baseRoomName: 'E38S45',
        },
        {
            roomName: 'E38S48',
            workingPosition: [31, 13],
            bodyCarrier: BodyWCM(1, 15, 8),
            bodyReserver: [MOVE, MOVE, MOVE, CLAIM, CLAIM, CLAIM],
            targetId: idRoom3.linkDown,
            baseRoomName: 'E38S47',
        }
    ];

    // -------------------- Defender & Worker & Reserver --------------------

    let roomDone = {};
    for (let info of sourceInfo) {
        let roomName = info.roomName;
        if (roomDone[roomName]) continue;
        roomDone[roomName] = true;

        const room = Game.rooms[roomName];
        const baseRoom = Game.rooms[info.baseRoomName];
        const spawn = baseRoom.getSpawnNameList();
        let conf;

        conf = {
            name: 'OuterDefender_' + roomName,
            role: 'outerDefender',
            body: bodyOuterDefender,
            args: {roomName: roomName},
            require: 0,  // use tmp require to spawn
            spawn: spawn,
        };
        confs.push(conf);

        conf = {
            name: 'OuterAttacker_' + roomName,
            role: 'outerAttacker',
            body: bodyOuterAttacker,
            args: {roomName: roomName},
            require: room && (room.find(FIND_HOSTILE_STRUCTURES).length > 0) ? 1 : 0,
            spawn: spawn,
        };
        confs.push(conf);

        let bodyReserver = info.bodyReserver ||
            [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
            CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM, CLAIM];
        conf = {
            name: 'Reserver_' + roomName,
            role: 'reserver',
            body: bodyReserver,
            require: room && room.controller && !room.controller.my &&
                (!room.controller.reservation ||
                 room.controller.reservation.username !== 'orbitingflea' ||
                 room.controller.reservation.ticksToEnd < 1000) &&
                !roomDanger(roomName) ? 1 : 0,
            args: { roomName: roomName },
            spawn: spawn,
        };
        confs.push(conf);
    }

    // -------------------- Diggers & Carriers For Each Source Point --------------------

    for (let info of sourceInfo) {
        const room = Game.rooms[info.roomName];
        const sourceId = (() => {
            if (info.sourceId) return info.sourceId;
            if (!room) return null;
            return room.find(FIND_SOURCES)[0].id;
        })();
        const customName = info.customName || info.roomName;
        const baseRoom = Game.rooms[info.baseRoomName];
        const spawn = baseRoom.getSpawnNameList();

        let conf = {
            name: 'OuterDigger_' + customName,
            role: 'outerDigger',
            body: bodyOuterDigger,
            require: !roomDanger(info.roomName) ? 1 : 0,
            args: {
                roomName: info.roomName,
                workingPosition: info.workingPosition,
                sourceId: sourceId,
                retreatRoom: info.baseRoomName,
            },
            spawn: spawn
        };
        confs.push(conf);

        conf = {
            name: 'OuterCarrier_' + customName,
            role: 'outerCarrier',
            body: info.bodyCarrier || bodyOuterCarrier,
            require: roomDanger(info.roomName) ? 0 : info.requireCarrier != null ? info.requireCarrier : 1,
            args: {
                roomName: info.roomName,
                resourcePosition: info.workingPosition,
                targetId: info.targetId,
            },
            spawn: spawn
        };
        confs.push(conf);
    }

    return confs;
}
