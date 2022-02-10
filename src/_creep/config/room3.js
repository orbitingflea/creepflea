// config for room3

import { BodyWCM } from 'util.js';
import { UpdateStructureStatus } from 'CarrierSystem.js';
import AutoRoomList from './autoRoomList.js';

const roomName = 'E38S47';
const commonSuffix = '_R3';

export const id = {
    storage: '61de6e8cb2985e59167c3927',
    linkDown: '61e2a91d207acd6643833145',
};

export default function ConfigList() {
    const room = Game.rooms[roomName];
    UpdateStructureStatus(room);

    let confs = AutoRoomList(room.name, commonSuffix, {
        bodyWorker: BodyWCM(10, 6, 8),
    });

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
