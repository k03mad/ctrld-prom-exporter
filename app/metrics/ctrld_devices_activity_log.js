import client from 'prom-client';

import Ctrld from '../api/cotrold.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const QUERIES_TS_INTERVAL = 60 * 60 * 1000;

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Devices activity log',
    labelNames: ['activity', 'name'],

    async collect() {
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
            answers: {},
            answersCity: {},
            deviceId: {},
            domainsAllowed: {},
            domainsBlocked: {},
            protocol: {},
            rrType: {},
            sourceGeoip: {},
            sourceGeoipDevice: {},
            sourceIp: {},
        };

        queries.forEach(query => {
            const deviceName = devices.find(device => device.PK === query.deviceId)?.name;

            if (deviceName) {
                count(store.deviceId, deviceName);
            }

            count(store.protocol, query.protocol);
            count(store.rrType, query.rrType);

            if (deviceName) {
                count(store.sourceIp, `${query.sourceIp} (${deviceName})`);
            }

            count(store.actionTrigger, `[${query.actionTrigger}]${query.actionTriggerValue ? ` ${query.actionTriggerValue}` : ''}${query.actionSpoofTarget ? ` => ${query.actionSpoofTarget}` : ''}`);

            if (query.actionTrigger === 'default') {
                count(store.domainsAllowed, query.question);
            }

            if (query.actionTrigger === 'filter') {
                count(store.domainsBlocked, query.question);
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
        });

        Object.entries(store).forEach(([label, data]) => {
            Object.entries(data).forEach(([name, value]) => {
                this.labels(label, name).set(value);
            });
        });
    },
});
