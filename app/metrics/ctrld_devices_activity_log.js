import client from 'prom-client';

import Ctrld from '../api/Ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const REQUESTS_INTERVAL = 5 * 60 * 1000;

const setLabels = (ctx, store, labels) => {
    labels.forEach(label => {
        if (Object.keys(store[label]).length > 0) {
            Object.entries(store[label]).forEach(([name, value]) => {
                ctx.labels(label, name).set(value);
            });
        } else {
            ctx.reset();
        }
    });
};

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Devices activity log',
    labelNames: ['activity', 'name'],

    async collect() {
        const epoch = Date.now();

        const [{devices}, {queries}] = await Promise.all([
            Ctrld.devices(),
            Ctrld.queries({
                startTs: epoch - REQUESTS_INTERVAL,
                endTs: epoch,
            }),
        ]);

        const store = {
            actionTrigger: {},
            answers: {},
            deviceId: {},
            protocol: {},
            question: {},
            rrType: {},
            sourceGeoip: {},
            sourceGeoipDevice: {},
            sourceIp: {},
        };

        queries.forEach(query => {
            const deviceName = devices.find(device => device.PK === query.deviceId).name;

            count(store.actionTrigger, `[${query.actionTrigger}]${query.actionTriggerValue ? ` ${query.actionTriggerValue}` : ''}${query.actionSpoofTarget ? ` => ${query.actionSpoofTarget}` : ''}`);
            count(store.deviceId, deviceName);
            count(store.protocol, query.protocol);
            count(store.question, query.question);
            count(store.rrType, query.rrType);
            count(store.sourceIp, `${query.sourceIp} (${deviceName})`);

            if (query.answers?.geoip?.countryCode) {
                count(store.answers, `${query.answers.geoip.countryCode} ${query.answers.geoip?.city || ''}`.trim());
            }

            if (query.sourceGeoip.countryCode) {
                count(store.sourceGeoip, `${query.sourceGeoip.countryCode} ${query.sourceGeoip.city || ''}`.trim());
                count(store.sourceGeoipDevice, `${query.sourceGeoip.countryCode}${query.sourceGeoip.city ? ` ${query.sourceGeoip.city}` : ''} (${deviceName})`);
            }
        });

        setLabels(this, store, [
            'actionTrigger',
            'answers',
            'deviceId',
            'protocol',
            'question',
            'rrType',
            'sourceGeoip',
            'sourceGeoipDevice',
            'sourceIp',
        ]);
    },
});
