/* eslint-disable unicorn/filename-case */

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Changelog',
    labelNames: ['type', 'text'],

    async collect(ctx) {
        ctx.reset();

        const {changelogs} = await Ctrld.changelog();

        changelogs[0].split('\n').filter(Boolean).forEach((item, i) => {
            ctx.labels('changelog', item).set(i + 1);
        });
    },
};
