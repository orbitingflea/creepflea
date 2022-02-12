// called each tick

import ListOuterSource from './outerSource.js';
import ListManual from './manual.js';

export default function BuildConfigList() {
    let confs = [];
    confs = confs.concat(ListOuterSource());
    confs = confs.concat(ListManual());
    return confs;
}
