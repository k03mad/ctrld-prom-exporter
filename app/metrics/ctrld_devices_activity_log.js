import client from 'prom-client';

import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const QUERIES_TS_INTERVAL = 60 * 60 * 1000;

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Devices activity log',
    labelNames: ['activity', 'name'],

    async collect() {
        this.reset();

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
            actionTriggerNrdDomain: {},
            actionTriggerPornDomain: {},
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
            const deviceName = devices.find(device => device.PK === query.deviceId)?.name;

            count(store.protocol, query.protocol);
            count(store.rrType, query.rrType);

            let actionTrigger = `[${query.actionTrigger}]`;

            if (query.actionTriggerValue) {
                actionTrigger += ` ${query.actionTriggerValue}`;

                if (query.actionTriggerValue === 'nrd') {
                    count(store.actionTriggerNrdDomain, `${actionTrigger} => ${query.question}`);
                } else if (query.actionTriggerValue === 'porn') {
                    count(store.actionTriggerPornDomain, `${actionTrigger} => ${query.question}`);
                }
            }

            if (query.actionSpoofTarget) {
                if (query.actionTriggerValue) {
                    actionTrigger += ' =>';
                }

                actionTrigger += ` ${query.actionSpoofTarget}`;
            }

            count(store.actionTrigger, actionTrigger);

            if (deviceName) {
                count(store.sourceIp, `${query.sourceIp} (${deviceName})`);
                count(store.deviceId, deviceName);

                if (!['default', 'filter'].includes(query.actionTrigger)) {
                    count(store.actionTriggerDevice, `${actionTrigger} (${deviceName})`);
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
                this.labels(label, name).set(value);
            });
        });
    },
});
