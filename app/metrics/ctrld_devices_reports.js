import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';
import {epochMonthAgo, epochWeekAgo} from '../helpers/time.js';

const TOP_COUNT = 50;

const reports = [
    'blocked-by-domain/pie-chart',
    'blocked-by-filter/pie-chart',
    'bypassed-by-domain/pie-chart',
    'counts-by-destination-country',
    'counts-by-destination-isp',
    'counts-by-source-country',
    'redirected-by-domain/pie-chart',
    'redirected-by-location/pie-chart',
    'service-triggered-by-service/pie-chart',
];

const reportTime = 'all-by-verdict';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Devices reports',
    labelNames: ['report', 'name'],

    async collect(ctx) {
        ctx.reset();

        await Promise.all([
            ['week', epochWeekAgo],
            ['month', epochMonthAgo],
        ].map(async ([intervalName, intervalTs]) => {
            const [{queries}] = await Promise.all([
                Ctrld.getReportTime({report: reportTime, startTs: intervalTs()}),

                Promise.all(reports.map(async report => {
                    const {queries: queriesPie} = await Ctrld.getReport({report, startTs: intervalTs()});

                    [...Object.entries(queriesPie)]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, TOP_COUNT)
                        .forEach(([label, counter]) => {
                            const reportName = `${report.split('/')[0]}-${intervalName}`;
                            ctx.labels(reportName, label).set(counter);
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
                ctx.labels(`${reportTime}-${intervalName}`, action).set(value);
            });
        }));
    },
};
