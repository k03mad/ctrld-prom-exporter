/* eslint-disable unicorn/filename-case */

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Locations',
    labelNames: ['type'],

    async collect(ctx) {
        ctx.reset();

        const {network} = await Ctrld.network();
        ctx.labels('locations').set(network.length);
    },
};
