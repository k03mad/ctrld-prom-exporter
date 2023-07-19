import client from 'prom-client';

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';
import {epochMonthAgo, epochWeekAgo} from '../helpers/time.js';

const TOP_COUNT = 50;

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Devices reports',
    labelNames: ['report', 'name'],

    async collect() {
        await Promise.all([
            ['week', epochWeekAgo],
            ['month', epochMonthAgo],
        ].map(async ([intervalName, intervalTs]) => {
            const reports = [
                'bypassed-by-domain',
                'blocked-by-domain',
                'blocked-by-filter',
                'redirected-by-location',
                'redirected-by-domain',
                'service-triggered-by-service',
            ];

            await Promise.all(reports.map(async report => {
                const {queries} = await Ctrld.getReport({report, startTs: intervalTs()});

                [...Object.entries(queries)]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, TOP_COUNT)
                    .forEach(([label, count]) => {
                        this.labels(`${report}-${intervalName}`, label).set(count);
                    });
            }));
        }));
    },
});
