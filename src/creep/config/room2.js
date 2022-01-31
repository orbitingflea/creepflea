// config for room2

import { BodyWCM } from '@/util.js';
import { UpdateStructureStatus } from '@/CarrierSystem.js';
import AutoRoomList from './autoRoomList.js';

const roomName = 'E39S45';
const commonSuffix = '_R2';
const carrierMain = BodyWCM(0, 10, 5);

export const id = {
    container_near_controller: '61d4151e76241cb831f71b24',
    controller: '5bbcaf4a9099fc012e63a6e6',
    container_near_source: '61d3c908896d0d4e9caa5551',
    source: '5bbcaf4a9099fc012e63a6e7',
    storage: '61d6c3647312ef616aabc6c6',
    link_near_source: '61da40af0ec4284fd204cb11',
    link_center: '61d9ed408c3e66030f284879',
};

export default function ConfigList() {
    const room = Game.rooms[roomName];
    UpdateStructureStatus(room);

    let confs = AutoRoomList(room.name, commonSuffix);
    // console.log(JSON.stringify(confs));

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