// config for room4

import { BodyWCM } from 'util.js';
import { UpdateStructureStatus } from 'CarrierSystem.js';
import AutoRoomList from './autoRoomList.js';

const roomName = 'E37S45';
const commonSuffix = '_R4';

export const id = {
    storage: '61f095924aca3ad46423a5fd',
};

export default function ConfigList() {
    const room = Game.rooms[roomName];
    UpdateStructureStatus(room);

    let confs = AutoRoomList(room.name, commonSuffix, {
        // bodyWorker: BodyWCM(10, 6, 8),
    });

    confs.find(conf => conf.name === 'Worker').require = 2;

    // -------------------- add suffix & spawn --------------------

    const spawnList = room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_SPAWN);
        }
    }).map((obj) => obj.name);

    for (let i = 0; i < confs.length; i++) {
        confs[i].name = confs[i].name + commonSuffix;
        if (confs[i].spawn == null) confs[i].spawn = spawnList;
    }

    return confs;
}
