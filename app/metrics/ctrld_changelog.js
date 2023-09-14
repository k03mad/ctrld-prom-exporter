import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Changelog',
    labelNames: ['type', 'text'],

    async collect(ctx) {
        ctx.reset();

        const {changelogs} = await Ctrld.changelog();
        ctx.labels('changelog', changelogs[0]).set(1);
    },
};
