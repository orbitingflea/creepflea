/**
 * 本文件 export 若干函数，用于帮助设计 Creep Body。
 */

export function designCarrier(energyLimit: number, capacityNeed: number = Infinity, workNeed: number = 0): BodyPartConstant[] {
  let body: BodyPartConstant[] = [];
  let energy = 0;
  let capacity = 0;
  let nWork = 0;
  while (body.length + 3 <= 50 && energy + 150 <= energyLimit && capacity < capacityNeed) {
    if (energy + 200 <= energyLimit && nWork < workNeed) {
      body.push(WORK);
      body.push(CARRY);
      body.push(MOVE);
      energy += 200;
      capacity += 50;
      nWork++;
    } else {
      body.push(CARRY);
      body.push(CARRY);
      body.push(MOVE);
      energy += 150;
      capacity += 100;
    }
  }
  return body;
}

export function designBalanceWorker(energyLimit: number, repeatLimit: number = Infinity): BodyPartConstant[] {
  let body: BodyPartConstant[] = [];
  let energy = 0;
  let repeat = 0;
  while (body.length + 3 <= 50 && energy + 200 <= energyLimit && repeat + 1 <= repeatLimit) {
    body.push(WORK);
    body.push(CARRY);
    body.push(MOVE);
    energy += 200;
    repeat++;
  }
  return body;
}

export function designRepeatSequence(sequence: BodyPartConstant[], energyLimit: number, repeatLimit: number = Infinity): BodyPartConstant[] {
  let repeat = Math.floor(Math.min(Math.min(repeatLimit, 50 / sequence.length), energyLimit / bodyCost(sequence)));
  let body: BodyPartConstant[] = [];
  for (let i = 0; i < repeat; i++) {
    body = body.concat(sequence);
  }
  return body;
}

export function bodyRepeat(parts: [BodyPartConstant, number][]): BodyPartConstant[] {
  let body: BodyPartConstant[] = [];
  for (let i = 0; i < parts.length; ++i) {
    for (let j = 0; j < parts[i][1]; ++j) {
      body.push(parts[i][0]);
    }
  }
  return body;
}

export function bodyWCM(nWork: number, nCarry: number, nMove: number): BodyPartConstant[] {
  return bodyRepeat([[WORK, nWork], [CARRY, nCarry], [MOVE, nMove]]);
}

export function bodyCost(body: BodyPartConstant[]): number {
  let cost = 0;
  for (let i = 0; i < body.length; ++i) {
    cost += BODYPART_COST[body[i]];
  }
  return cost;
}
