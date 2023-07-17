import client from 'prom-client';

import Ctrld from '../api/Ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Last activity time',
    labelNames: ['name'],

    async collect() {
        const {devices} = await Ctrld.get('devices');

        devices.forEach(({last_activity, name}) => {
            this.set({name}, last_activity);
        });
    },
});
