import util from 'util.js';
import creepCommon from 'creep.common.js';

export default (args) => ({
    // args = {roomName}
    prepare: creepCommon.prepareGotoBlindObject(
        Game.rooms[args.roomName] ? Game.rooms[args.roomName].controller.id : null,
        args.roomName,
        1
    ),

    source: creep => {
        return true;
    },

    target: creep => {
        const target = Game.rooms[args.roomName].controller;
        const state = target.reservation;
        if (state && state.username !== creep.owner.username) {
            creep.attackController(target);
        } else {
            creep.reserveController(target);
        }
        return false;
    }
});
