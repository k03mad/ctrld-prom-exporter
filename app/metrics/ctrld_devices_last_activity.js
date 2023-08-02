import client from 'prom-client';

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Devices last activity time',
    labelNames: ['name'],

    async collect() {
        this.reset();

        const {devices} = await Ctrld.devices();

        devices.forEach(({last_activity, name}) => {
            this.labels(name).set(last_activity);
        });
    },
});
