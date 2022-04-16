interface DevelopeOpts {
  nickName?: string;
  strongUpgraderThreshold?: number;
  workerSpawnThreshold?: number;
  energyEmergencyThreshold?: number;
  weakUpgrader?: boolean;
}

interface CreepConfigPresetIncomplete {
  name: string;
  role: string;
  body: BodyPartConstant[];
  require: number | (() => number);
  args: CreepRoleArgs | (() => CreepRoleArgs);
  spawn?: string[];
  liveThreshold?: number;

  priority?: number;
}

interface RoomObjectCache {
  needEnergy?: boolean;
}
