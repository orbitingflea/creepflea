export {};

declare global {
  type CreepConfigArgs = Object;

  interface CreepConfig {
    name: string;
    role: string;
    body: BodyPartConstant[];
    require: number;
    args: CreepConfigArgs;
    spawn: string[];
    liveThreshold: number;
  }

  interface CreepConfigWork {
    role: string;
    args: CreepConfigArgs;
  }

  interface CreepConfigPreset {
    name: string;
    role: string;
    body: BodyPartConstant[];
    require: number | (() => number);
    args: CreepConfigArgs | (() => CreepConfigArgs);
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
