import developeRoomConfigList from './develope';
import room1 from './room1';

let conf: CreepConfigPreset[];
let actions: (() => void)[];

function add(data: [CreepConfigPreset[], (() => void)[]]): void {
  conf = conf.concat(data[0]);
  actions = actions.concat(data[1]);
}

function defaultConfig(roomName: string, nickName: string) {
  add(developeRoomConfigList(roomName, {nickName}));
}

export default function buildConfigList(): [CreepConfigPreset[], (() => void)[]] {
  conf = [];
  actions = [];
  add(room1());
  add(developeRoomConfigList('E39S45', {nickName: 'R2'}));
  add(developeRoomConfigList('E38S47', {nickName: 'R3'}));
  add(developeRoomConfigList('E37S45', {nickName: 'R4'}));
  return [conf, actions];
}
