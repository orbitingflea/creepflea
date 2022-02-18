/**
 * 本文件为一个完全运营的房间自动生成 config 列表。
 * 仅仅包括本房间内的工作 creep，不包括开采外矿等等扩张内容。
 *
 * 仅仅适用于有 storage 的房间。
 *
 * 停机重启协议：1. 当 storage 中有充足能量，但是没有 carrier、没有能力生成 carrier 时，生成特殊的 sos carrier，填充 extension
 * 2. 当 storage 中没有充足能量、没有一套完整的资源运到 storage 的体系，则降低所有 source 开采活动需要的 creep 的 bodycost，保证正常运行。
 *
 * 模块：
 * - 运输模块：中央运输者、主运输者。
 * - 开采模块：针对每个 source 的建筑结构来安排。
 */

// import { UpdateStructureStatus } from 'CarrierSystem.js';
import taskCommon from 'task.common';
import { addStorageDemand, getDemands } from 'modules/demand/main';
import {
  designCarrier,
  designBalanceWorker,
  designRepeatSequence,
  bodyCost,
  bodyWCM,
} from './utils/design';

let room: Room;
let roomName: string;
let nickName: string;
let conf: CreepConfigPresetIncomplete[];
let funcList: (() => void)[];
let opts: DevelopeOpts;

let energyLimit: number;
let centerPos: RoomPosition | null;
let centerLink: StructureLink | null;

let emergency: string;
let containerNearController: StructureContainer | null;

export default function developeRoomConfigList(_roomName: string, _opts?: DevelopeOpts): [CreepConfigPreset[], (() => void)[]] {
  roomName = _roomName;
  room = Game.rooms[roomName];
  if (!room) {
    console.log(`[ERROR] developeRoomConfigList: ${roomName} is not a valid room name.`);
    return [[], []];
  }
  if (!room.storage) {
    console.log(`[ERROR] developeRoomConfigList: ${roomName} does not have storage.`);
    return [[], []];
  }
  if (!room.controller || !room.controller.my) {
    console.log(`[ERROR] developeRoomConfigList: ${roomName} is not mine.`);
    return [[], []];
  }
  opts = _opts || {};
  // nickName = opts.nickName || roomName;
  conf = [];
  funcList = [];

  main();

  conf = _.sortBy(conf, (c) => -(c.priority || 0));

  let spawnList = _.filter(Game.spawns, (spawn) => spawn.room.name === roomName)
    .map((spawn) => spawn.name);
  for (let i = 0; i < conf.length; ++i) {
    if (conf[i].priority !== undefined) {
      delete conf[i].priority;
    }
    if (conf[i].spawn === undefined) {
      conf[i].spawn = spawnList;
    }
    if (conf[i].liveThreshold === undefined) {
      conf[i].liveThreshold = 0;
    }
  }
  return [conf as CreepConfigPreset[], funcList];
}

function main() {
  nickName = opts.nickName || roomName;
  energyLimit = room.energyCapacityAvailable;
  containerNearController = null;

  emergency = '';
  let emergencyThreshold = opts.energyEmergencyThreshold || 10000;
  if (room.storage!.store[RESOURCE_ENERGY] < emergencyThreshold) {
    emergency = 'energy';
    console.log(`[WARN] energy emergency in room ${room.name}`);
    energyLimit = Math.max(room.energyAvailable, 300);
  } else {
    let masterName = `CarrierFromStorage_${nickName}`;
    let bigCarrierBody = designCarrier(energyLimit, Infinity);
    let masterCost = bodyCost(bigCarrierBody);
    if (room.energyAvailable < masterCost && !room.myCreeps.some(c => c.memory.configName === masterName)) {
      emergency = 'carrier';
      console.log(`[WARN] carrier emergency in room ${room.name}`);
    }
  }

  let emergencyCarrier: CreepConfigPresetIncomplete = {
    name: `EmergencyCarrier_${nickName}`,
    role: 'carrier',
    body: designCarrier(Math.max(300, room.energyAvailable), Infinity),
    priority: 2,
    require: emergency === 'carrier' ? 1 : 0,
    args: ((roomName: string) => () => {
      let room = Game.rooms[roomName];
      let [sources, sinks] = addStorageDemand(
        room,
        {},
        {energy: room.structuresOfTypes(STRUCTURE_SPAWN, STRUCTURE_EXTENSION).filter(s => s.store!.getFreeCapacity(RESOURCE_ENERGY) > 0)}
      );
      return {
        sources,
        sinks,
        deathBehavior: {
          action: 'save',
          threshold: 20,
          saveId: room.storage!.id
        }
      } as CarrierArgs
    })(roomName)
  };
  conf.push(emergencyCarrier);

  // find center pos
  centerPos = null;
  centerLink = null;
  for (let f of room.find(FIND_FLAGS, {filter: {color: COLOR_WHITE}})) {
    if (f.pos.isNearTo(room.storage!)) {
      let links = f.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_LINK}}) as StructureLink[];
      if (links.length > 0) {
        centerLink = links[0];
        centerPos = f.pos;
        break;
      }
    }
  }

  carrierPart();
  let sources = room.sources;
  for (let i = 0; i < sources.length; ++i) {
    harvestPart(sources[i], i);
  }
  upgraderPart();
  workerPart(containerNearController);
  minerPart();
}



function carrierPart() {
  let bigCarrierBody = designCarrier(energyLimit, Infinity);
  let smallCarrierCapacity = room.controller!.level >= 7 ? 800 : 400;
  let smallCarrierBody = designCarrier(energyLimit, smallCarrierCapacity);

  // CarrierFromStorage
  let carrierFromStorage: CreepConfigPresetIncomplete = {
    name: `CarrierFromStorage_${nickName}`,
    role: 'carrier',
    body: bigCarrierBody,
    priority: 1,
    require: 1,
    args: ((roomName: string) => () => {
      let room = Game.rooms[roomName];
      let [sources, sinks] = getDemands(room);
      return {
        sources,
        sinks,
        deathBehavior: {
          action: 'save',
          saveId: room.storage!.id,
          threshold: 50,
        }
      } as CarrierArgs
    })(roomName),
    liveThreshold: 50
  };
  conf.push(carrierFromStorage);

  if (centerPos) {
    // carry energy from link to storage
    let carrierCenter: CreepConfigPresetIncomplete = {
      name: `CarrierCenter_${nickName}`,
      role: 'carrierCenter',
      body: smallCarrierBody,
      require: 1,
      args: {
        storageId: room.storage!.id,
        linkId: centerLink!.id,
        workingPosition: [centerPos.x, centerPos.y]
      }
    };
    conf.push(carrierCenter);
  }

  // Recycler
  let recycler: CreepConfigPresetIncomplete = {
    name: `Recycler_${nickName}`,
    role: 'recycler',
    body: smallCarrierBody,
    require: 0,  // deprecated
    args: {
      targetId: room.storage!.id,
      sourceIdList: taskCommon.GetRecyclerTargets(room),
    },
    priority: -1
  };
  conf.push(recycler);
}

function harvestPart(source: Source, label: number) {
  let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
  }) as StructureContainer[];
  let flags = source.pos.findInRange(FIND_FLAGS, 1, {
    filter: (flag) => flag.color === COLOR_WHITE
  });
  let workPos: null | RoomPosition = null;
  let link: null | StructureLink = null;
  if (containers.length > 0) {
    workPos = containers[0].pos;
    if (centerLink) {
      link = workPos.findInRange(FIND_MY_STRUCTURES, 1, {
        filter: (s) => s.structureType === STRUCTURE_LINK && s !== centerLink
      })[0] as StructureLink || null;
    }
  } else if (flags.length > 0 && centerLink) {
    for (let f of flags) {
      link = f.pos.findInRange(FIND_MY_STRUCTURES, 1, {
        filter: (s) => s.structureType === STRUCTURE_LINK && s !== centerLink
      })[0] as StructureLink || null;
      if (link) {
        workPos = f.pos;
        break;
      }
    }
  }

  let fullstackBody = designBalanceWorker(energyLimit);

  if (!workPos) {
    // basic mining
    let basicDigger: CreepConfigPresetIncomplete = {
      name: `Digger_${label}_${nickName}`,
      role: 'carrier',
      body: fullstackBody,
      require: 1,
      args: {
        sources: {energy: source.id},
        sinks: {energy: room.storage!.id}
      }
    };
    conf.push(basicDigger);

  } else if (link) {
    // link mining
    let body = bodyWCM(6, 2, 3);
    if (bodyCost(body) > energyLimit) {
      body = bodyWCM(2, 1, 1);
    }
    let linkDigger: CreepConfigPresetIncomplete = {
      name: `Digger_${label}_${nickName}`,
      role: 'diggerLink',
      body,
      require: 1,
      args: {
        sourceId: source.id,
        linkId: link.id,
        roomName: room.name,
        workingPosition: [workPos.x, workPos.y]
      }
    };
    conf.push(linkDigger);

    // run link logic
    funcList.push(((linkId: Id<StructureLink>, centerLinkId: Id<StructureLink>) => () => {
      let link = Game.getObjectById(linkId);
      let centerLink = Game.getObjectById(centerLinkId);
      if (!link || !centerLink) return;
      if (link.store[RESOURCE_ENERGY] > 700) {
        link.tryTransfer(centerLink);
      }
    })(link.id, centerLink!.id));

  } else {
    // container mining
    if (containers.length === 0) {
      console.log(`[ERROR] developeRoomConfigList: impossible branch for ${source}`);
      return;
    }
    let container = containers[0];
    let body = bodyWCM(6, 0, 3);
    if (bodyCost(body) > energyLimit) {
      body = bodyWCM(2, 0, 1);
    }
    let containerDigger: CreepConfigPresetIncomplete = {
      name: `Digger_${label}_${nickName}`,
      role: 'digger',
      body: body,
      require: 1,
      args: {
        sourceId: source.id,
        containerId: container.id
      }
    };
    conf.push(containerDigger);

    // carrier for source
    let needCarrier = !(centerPos && centerPos.isNearTo(container));
    if (needCarrier) {
      let dist = room.storage!.pos.getRangeTo(container) + 1;
      let needCapacity = dist * 2 * 10;
      let body = designCarrier(energyLimit, Math.max(needCapacity, 200));
      let carrier: CreepConfigPresetIncomplete = {
        name: `CarrierForSource_${label}_${nickName}`,
        role: 'carrier',
        body,
        require: 1,
        args: ((containerId: Id<StructureContainer>) => () => {
          let container = Game.getObjectById(containerId);
          if (!container) return null;
          let containerFull = container.store.getFreeCapacity() === 0;
          let threshold = containerFull ? 20 : 0;
          let resList = container.pos.lookFor(LOOK_RESOURCES).filter(r => r.resourceType === RESOURCE_ENERGY && r.amount >= threshold);
          let fromId = resList.length > 0 ? resList[0].id : containerId;
          return {
            sources: {energy: fromId},
            sinks: {energy: room.storage!},
            deathBehavior: {
              action: 'save',
              saveId: room.storage!.id,
              threshold: 50,
            }
          } as CarrierArgs
        })(container.id)
      };
      conf.push(carrier);
    } else {
      // cheat: let center carrier args.containerId = container.id
      let item = conf.find(c => c.name === `CarrierCenter_${nickName}`);
      if (item) {
        (item.args as any).containerId = container.id;
      } else {
        console.log(`[ERROR] developeRoomConfigList: impossible branch for ${source}: CarrierCenter not found.`);
      }
    }
  }
}

function upgraderPart() {
  const controller = room.controller!;
  let containers = room.containers.filter(s => s.pos.inRangeTo(controller, 3));
  let container = containers[0] || null;
  let threshold = opts.strongUpgraderThreshold || 300000;
  let useStrong = controller.level < 8 && room.storage!.store[RESOURCE_ENERGY] >= threshold;
  if (!container) {
    upgraderWithoutContainer(useStrong);
  } else {
    upgraderWithContainer(container, useStrong);
  }
}

function upgraderWithoutContainer(useStrong: boolean) {
  let repeatLimit = useStrong ? Infinity : 5;
  let body = designBalanceWorker(energyLimit, repeatLimit);
  let upgrader: CreepConfigPresetIncomplete = {
    name: `Upgrader_${nickName}`,
    role: 'worker',
    body,
    require: 1,
    args: {
      sources: room.storage!.id,
      tasks: {
        id: room.controller!.id,
        action: 'upgrade',
        priority: 0,
      } as WorkerTask,
      deathBehavior: {
        saveId: room.storage!.id,
        action: 'save',
        threshold: 50,
      }
    } as WorkerArgs
  };
  conf.push(upgrader);
}

function upgraderWithContainer(container: StructureContainer, useStrong: boolean) {
  containerNearController = container;
  let body = bodyWCM(6, 2, 3);
  if (bodyCost(body) > energyLimit) {
    body = bodyWCM(2, 1, 1);
    useStrong = false;
  } else if (useStrong) {
    body = designRepeatSequence(body, energyLimit);
  }
  let upgrader: CreepConfigPresetIncomplete = {
    name: `Upgrader_${nickName}`,
    role: 'worker',
    body,
    require: 1,
    args: {
      sources: container.id,
      tasks: {
        id: room.controller!.id,
        action: 'upgrade',
        priority: 0,
      } as WorkerTask,
      deathBehavior: {
        saveId: container.id,
        action: 'save',
        threshold: 3,
      }
    }
  };
  conf.push(upgrader);
  // container.cache.isContainerNearController = true;
  container.cache.isEnergySink = true;

  let dist = room.storage!.pos.getRangeTo(container) + 1;
  let needCapacity = dist * 2 * upgraderThroughput(body);
  let carrierBody = designCarrier(energyLimit, Math.max(needCapacity, 200));
  let carrier: CreepConfigPresetIncomplete = {
    name: `CarrierForUpgrader_${nickName}`,
    role: 'carrier',
    body: carrierBody,
    require: (() => {
      if (!useStrong) return 0;
      let currentUpgrader = room.myCreeps.filter(c => c.memory.configName === `Upgrader_${nickName}`)[0] || null;
      if (currentUpgrader && currentUpgrader.body.length >= 12) {
        return 1;
      } else {
        return 0;
      }
    })(),
    args: {
      sources: {energy: room.storage!.id},
      sinks: {energy: container.id},
      deathBehavior: {
        action: 'save',
        saveId: container.id,
        threshold: 20,
      }
    } as CarrierArgs,
    priority: -1
  };
  conf.push(carrier);
}

function upgraderThroughput(body: BodyPartConstant[]): number {
  // energy consuming per tick
  let nWork = body.filter(b => b === WORK).length;
  if (nWork === 0) {
    console.log(`[ERROR] upgraderThroughput: no work in ${body}`);
    return 0;
  }
  let capacity = body.filter(b => b === CARRY).length * 50;
  let period = Math.ceil(capacity / nWork) + 1;
  return capacity / period;
}

function workerPart(container?: StructureContainer | null) {
  let body = designBalanceWorker(energyLimit);
  let threshold = opts.workerSpawnThreshold || 100000;
  let sources = [room.storage!.id] as Id<RoomObject>[];
  if (container) sources.push(container.id);
  let worker: CreepConfigPresetIncomplete = {
    name: `Worker_${nickName}`,
    role: 'worker',
    body,
    require: room.storage!.store[RESOURCE_ENERGY] >= threshold &&
        taskCommon.GetWorkerTasks(room, room.controller!.level < 8).length > 0
        ? 1 : 0,
    args: ((roomName: string, sources: Id<RoomObject>[]) => () => {
      let room = Game.rooms[roomName];
      if (!room) return null;
      let doUpgrade = room.controller!.level < 8;
      return {
        sources: sources,
        tasks: taskCommon.GetWorkerTasks(room, doUpgrade),
        deathBehavior: {
          saveId: room.storage!.id,
          action: 'save',
          threshold: 50,
        }
      } as WorkerArgs
    })(roomName, sources)
  };
  conf.push(worker);
}

function minerPart() {
  if (!room.mineral) return;
  const mineral = room.mineral!;
  const container = mineral.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}})[0] as (StructureContainer | undefined) || null;
  if (!container) return;
  if (!mineral.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)) return;

  let body = designRepeatSequence(bodyWCM(2, 0, 1), energyLimit);
  let miner: CreepConfigPresetIncomplete = {
    name: `Miner_${nickName}`,
    role: 'miner',
    body,
    require: ((mineralId: Id<Mineral>) => () => {
      let mineral = Game.getObjectById(mineralId);
      return mineral && mineral.mineralAmount > 0 ? 1 : 0;
    })(mineral.id),
    args: {
      containerId: container.id,
      sourceId: mineral.id
    },
    priority: -1
  };
  conf.push(miner);

  let func = ((containerId: Id<StructureContainer>, roomName: string) => () => {
    if (Game.time % 10 === 0) {
      let container = Game.getObjectById(containerId);
      let room = Game.rooms[roomName];
      if (container && container.store.getUsedCapacity() >= 500) {
        for (let resType in container.store) {
          global.CarrierManager(roomName).NewTask(container.id, room.storage!.id, resType);
        }
      }
    }
  })(container.id, room.name);
  funcList.push(func);
}

/**
 * 怎么利用优先级来优雅地实现模块分离以及紧急情况处理？
 * 先看正常模块
 * 运输模块：CarrierFromStorage, CarrierCenter, Recycler
 * harvest 模块：Digger, {CarrierForDigger | linkfunc}
 * mining 模块
 * upgrader 模块
 *
 */
