import developeRoomConfigList from './develope';

let conf: CreepConfigPreset[];
let actions: (() => void)[];

function add(data: [CreepConfigPreset[], (() => void)[]]): void {
  conf = conf.concat(data[0]);
  actions = actions.concat(data[1]);
}

export default function buildConfigList(): [CreepConfigPreset[], (() => void)[]] {
  conf = [];
  actions = [];
  add(developeRoomConfigList('E38S45', {nickName: 'R1'}));
  add(developeRoomConfigList('E39S45', {nickName: 'R2', weakUpgrader: true}));
  add(developeRoomConfigList('E38S47', {nickName: 'R3'}));
  add(developeRoomConfigList('E37S45', {nickName: 'R4'}));
  return [conf, actions];
}
