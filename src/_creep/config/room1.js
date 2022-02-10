// config for room1

import { BodyWCM } from 'util.js';
import { UpdateStructureStatus } from 'CarrierSystem.js';
import AutoRoomList from './autoRoomList.js';

const roomName = 'E38S45';
const commonSuffix = '_R1';

export const id = {
    source_down: '5bbcaf379099fc012e63a55f',
    source_up: '5bbcaf379099fc012e63a55d',
    container_down: '61c9b463d054a45518e8b5e3',
    container_up: '61c9fced7a3c3521135e617c',
    link_up: '61cbe8e6b199f8706ab9b0ec',
    link_down: '61cb2c0a63208010d208e1f8',
    controller: '5bbcaf379099fc012e63a55e',
    container_near_controller: '61cbd8df1682cd84285bc145',
    storage: '61cb01a791dde3d80281b58e',
    mineral: '5bbcb651d867df5e5420771f',
    container_near_mineral: '61d1bde8c970355bfa5970a7',
    link_left: '61d9b48576241c09d3f8b6ba',
};

export default function ConfigList() {
    const room = Game.rooms[roomName];
    UpdateStructureStatus(room);

    let confs = AutoRoomList(room.name, commonSuffix, {
        bodyCarrierFromStorage: BodyWCM(0, 32, 16),
        bodyWorker: BodyWCM(20, 10, 15),
    });

    // Modifications:
    // 1. Extra work for central carrier
    confs.find((conf) => conf.name == 'CarrierCenter').args.containerId = id.container_down;
    confs.find((conf) => conf.name == 'CarrierForUpgrader').body = BodyWCM(0, 16, 8);

    // -------------------- add suffix --------------------

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
