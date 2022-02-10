import util from 'util.js';
import creepCommon from 'creep.common.js';

export default (args) => ({
    // args = {roomName}
    prepare: creep => {
        let room = Game.rooms[args.roomName];
        if (!room) {
            creep.moveTo(new RoomPosition(25, 25, args.roomName));
            return false;
        }
        const controller = room.controller;
        if (creep.pos.inRangeTo(controller, 1)) {
            return true;
        } else {
            creep.moveTo(controller, {visualizePathStyle: {stroke: '#ffffff'}});
            return false;
        }
    },

    source: creep => {
        return true;
    },

    target: creep => {
        let room = Game.rooms[args.roomName];
        let controller = room.controller;
        var result = creep.claimController(controller);
        if (result != OK) {
            // console.log('[INFO] claimController failed: ' + result);
        }
        return false;
    }
});
