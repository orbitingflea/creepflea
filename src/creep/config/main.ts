import room2 from './room2';

let conf: CreepConfigPreset[];
let actions: (() => void)[];

function add(data: [CreepConfigPreset[], (() => void)[]]): void {
  conf = conf.concat(data[0]);
  actions = actions.concat(data[1]);
}

export default function buildConfigList(): [CreepConfigPreset[], (() => void)[]] {
  conf = [];
  actions = [];
  add(room2());
  return [conf, actions];
}
