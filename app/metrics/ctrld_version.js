import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Version',
    labelNames: ['type'],

    async collect(ctx) {
        ctx.reset();

        const {versions} = await Ctrld.changelog();
        ctx.labels('version').set(Number(versions[0].replaceAll(/^v|\.(?=[^.]$)/g, '')));
    },
};
