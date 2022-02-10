// called each tick

import ListRoom1 from './room1.js';
import ListRoom2 from './room2.js';
import ListRoom3 from './room3.js';
import ListRoom4 from './room4.js';
import ListOuterSource from './outerSource.js';
import ListManual from './manual.js';

export default function BuildConfigList() {
    let confs = [];
    confs = confs.concat(ListRoom1());
    confs = confs.concat(ListRoom2());
    confs = confs.concat(ListRoom3());
    confs = confs.concat(ListRoom4());
    confs = confs.concat(ListOuterSource());
    confs = confs.concat(ListManual());
    return confs;
}