import developeRoomConfigList from './develope';
const roomName = 'E39S45';

export default function main(): [CreepConfigPreset[], (() => void)[]] {
  let [presets, actions] = developeRoomConfigList(roomName, {nickName: 'R2'});
  return [presets, actions];
}
