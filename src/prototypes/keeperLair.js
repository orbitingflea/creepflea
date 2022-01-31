import { GetDangerZone, IsDangerZoneActive } from 'skRoom.js';

Object.defineProperty(StructureKeeperLair.prototype, 'dangerZone', {
    configurable: true,
    get: function() {
        return GetDangerZone(this);
    }
});

Object.defineProperty(StructureKeeperLair.prototype, 'isDangerZoneActive', {
    configurable: true,
    get: function() {
        return IsDangerZoneActive(this);
    }
});
