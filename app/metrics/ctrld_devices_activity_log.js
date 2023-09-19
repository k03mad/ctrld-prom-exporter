import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const QUERIES_TS_INTERVAL = 60 * 60 * 1000;

const FULL_DATA_BY_ACTION = new Set([
    'filter',
    'rebind',
]);

const FULL_DATA_BY_FILTERS = new Set([
    'nrd',
    'porn',
    'ai_malware',
]);

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Devices activity log',
    labelNames: ['activity', 'name'],

    async collect(ctx) {
        ctx.reset();

        const epoch = Date.now();

        const [{devices}, {queries}] = await Promise.all([
            Ctrld.devicesCache(),
            Ctrld.queries({
                startTs: epoch - QUERIES_TS_INTERVAL,
                endTs: epoch,
            }),
        ]);

        const store = {
            actionTrigger: {},
            actionTriggerDevice: {},
            actionTriggerDomain: {},
            answers: {},
            answersCity: {},
            deviceId: {},
            protocol: {},
            rrType: {},
            sourceGeoip: {},
            sourceGeoipDevice: {},
            sourceIp: {},
            sourceIsp: {},
            sourceIspDevice: {},
        };

        queries.forEach(query => {
            count(store.protocol, query.protocol);
            count(store.rrType, query.rrType);

            const fullActionString = [`[${query.actionTrigger}]`];

            if (query.actionTriggerValue) {
                fullActionString.push(query.actionTriggerValue);
            }

            if (query.actionSpoofTarget) {
                if (query.actionTriggerValue) {
                    fullActionString.push('=>');
                }

                fullActionString.push(query.actionSpoofTarget);
            }

            count(store.actionTrigger, fullActionString.join(' '));

            const deviceName = devices.find(device => device.PK === query.deviceId)?.name;

            if (deviceName) {
                count(store.sourceIp, `${query.sourceIp} (${deviceName})`);
                count(store.deviceId, deviceName);

                fullActionString.push(`(${deviceName})`);

                if (!['default', 'filter'].includes(query.actionTrigger)) {
                    count(store.actionTriggerDevice, fullActionString.join(' '));
                }

                if (query.question) {
                    fullActionString.push('::', query.question);
                }

                if (
                    FULL_DATA_BY_ACTION.has(query.actionTrigger)
                    || FULL_DATA_BY_FILTERS.has(query.actionTriggerValue)
                ) {
                    count(store.actionTriggerDomain, fullActionString.join(' '));
                }
            }

            if (query.answers?.some(elem => elem.geoip?.countryCode)) {
                const answers = query.answers
                    .filter(elem => elem.geoip?.countryCode)
                    .flatMap(elem => ({geoip: elem.geoip.countryCode}));

                answers.forEach(answer => count(store.answers, answer.geoip));
            }

            if (query.answers?.some(elem => elem.geoip?.city)) {
                const answers = query.answers
                    .filter(elem => elem.geoip?.city)
                    .flatMap(elem => ({geoip: `${elem.geoip?.countryCode || ''} ${elem.geoip.city}`.trim()}));

                answers.forEach(answer => count(store.answersCity, answer.geoip));
            }

            if (query.sourceGeoip.countryCode) {
                count(store.sourceGeoip, `${query.sourceGeoip.countryCode} ${query.sourceGeoip.city || ''}`.trim());
                count(store.sourceGeoipDevice, `${query.sourceGeoip.countryCode}${query.sourceGeoip.city ? ` ${query.sourceGeoip.city}` : ''} (${deviceName})`);
            }

            if (query.sourceGeoip.isp) {
                count(store.sourceIsp, query.sourceGeoip.isp);
                count(store.sourceIspDevice, `${query.sourceGeoip.isp} (${deviceName})`);
            }
        });

        Object.entries(store).forEach(([label, data]) => {
            Object.entries(data).forEach(([name, value]) => {
                ctx.labels(label, name).set(value);
            });
        });
    },
};
