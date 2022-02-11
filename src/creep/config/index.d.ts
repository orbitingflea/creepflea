interface DevelopeOpts {
  nickName?: string;
  strongUpgraderThreshold?: number;
  workerSpawnThreshold?: number;
  energyEmergencyThreshold?: number;
}

interface CreepConfigPresetIncomplete {
  name: string;
  role: string;
  body: BodyPartConstant[];
  require: number | (() => number);
  args: CreepConfigArgs | (() => CreepConfigArgs);
  spawn?: string[];
  liveThreshold?: number;

  priority?: number;
}

interface RoomObjectCache {
  needEnergy?: boolean;
}
