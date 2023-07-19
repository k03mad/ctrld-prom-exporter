import client from 'prom-client';

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

const TOP_COUNT = 50;

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Devices reports',
    labelNames: ['report', 'name'],

    async collect() {
        const reports = [
            'bypassed-by-domain',
            'blocked-by-domain',
            'blocked-by-filter',
            'redirected-by-location',
            'redirected-by-domain',
            'service-triggered-by-service',
        ];

        await Promise.all(reports.map(async name => {
            const {queries} = await Ctrld.getReport({report: name});

            [...Object.entries(queries)]
                .sort((a, b) => b[1] - a[1])
                .slice(0, TOP_COUNT)
                .forEach(([label, count]) => {
                    this.labels(name, label).set(count);
                });
        }));
    },
});
