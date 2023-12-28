import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Latency',
    labelNames: ['type', 'host'],

    async collect(ctx) {
        ctx.reset();

        const {host, rtt} = await Ctrld.info();
        ctx.labels('latency', host).set(Number(rtt));
    },
};
