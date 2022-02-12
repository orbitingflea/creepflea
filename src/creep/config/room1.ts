import developeRoomConfigList from './develope';

export default function main(): [CreepConfigPreset[], (() => void)[]] {
  let [presets, actions] = developeRoomConfigList('E38S45', {nickName: 'R1'});
  let item = presets.find(item => item.name === `CarrierCenter_R1`);
  if (item) {
    (item.args as any).containerId = '61c9b463d054a45518e8b5e3';
  } else {
    console.log(`[ERROR] room 1 container near center not found.`);
  }
  return [presets, actions];
}
