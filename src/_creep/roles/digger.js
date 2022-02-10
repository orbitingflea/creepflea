export default (args) => ({
    // args: {sourceId, containerId}
    
    prepare: creep => {
        if (!creep.pos.isEqualTo(Game.getObjectById(args.containerId).pos)) {
            creep.moveTo(Game.getObjectById(args.containerId), {visualizePathStyle: {stroke: '#ffaa00'}});
            return false;
        }
        return true;
    },

    source: creep => {
        const source = Game.getObjectById(args.sourceId);
        creep.harvest(source);
        return false;
    },

    target: creep => {
        return true;
    }
});
