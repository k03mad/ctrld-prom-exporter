import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Devices last activity time',
    labelNames: ['name'],

    async collect(ctx) {
        ctx.reset();

        const {devices} = await Ctrld.devices();

        devices?.forEach(({last_activity, name}) => {
            ctx.labels(name).set(last_activity);
        });
    },
};
