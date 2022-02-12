export {};

declare global {
  type CreepRoleArgs = Object;

  interface CreepConfig {
    name: string;
    role: string;
    body: BodyPartConstant[];
    require: number;
    args: CreepRoleArgs;
    spawn: string[];
    liveThreshold: number;
  }

  interface CreepConfigWork {
    role: string;
    args: CreepRoleArgs;
  }

  interface CreepConfigPreset {
    name: string;
    role: string;
    body: BodyPartConstant[];
    require: number | (() => number);
    args: CreepRoleArgs | (() => CreepRoleArgs);
    spawn: string[];
    liveThreshold: number;
  }

  interface CreepManager {
    confList: CreepConfigPreset[];
    confMap: { [name: string]: {
      preset: CreepConfigPreset;
      data: CreepConfigWork;
      lastUpdateTime: number;
    } };
    tickHook: (() => void)[];
    getConfigWork: (confName: string) => CreepConfigWork | null;
    runUpdate: () => void;
    addTmpRequire: (name: string, number?: number) => number;
    runSpawn: () => void;

    _lastDeepUpdateTime?: number;
  }

  namespace NodeJS {
    interface Global {
      creepManager: CreepManager;
    }
  }

  let creepManager: CreepManager;
}
