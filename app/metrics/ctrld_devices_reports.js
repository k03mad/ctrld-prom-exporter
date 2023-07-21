import client from 'prom-client';

import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
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
            const reportsPie = [
                'bypassed-by-domain',
                'blocked-by-domain',
                'blocked-by-filter',
                'redirected-by-location',
                'redirected-by-domain',
                'service-triggered-by-service',
            ];

            const reportTime = 'all-by-verdict';

            const [{queries}] = await Promise.all([
                Ctrld.getReportTime({report: reportTime, startTs: intervalTs()}),

                Promise.all(reportsPie.map(async report => {
                    const {queries: queriesPie} = await Ctrld.getReportPie({report, startTs: intervalTs()});

                    [...Object.entries(queriesPie)]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, TOP_COUNT)
                        .forEach(([label, counter]) => {
                            this.labels(`${report}-${intervalName}`, label).set(counter);
                        });
                })),
            ]);

            const counters = {};

            queries.forEach(query => {
                Object.keys(query.count).forEach(elem => {
                    count(counters, elem, query.count[elem]);
                });
            });

            Object.entries(counters).forEach(([action, value]) => {
                this.labels(`${reportTime}-${intervalName}`, action).set(value);
            });
        }));
    },
});
