import fs from 'node:fs/promises';

import {getUnixTime, parseJSON} from 'date-fns';
import client from 'prom-client';

import Ctrld from '../api/Ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

const TIMESTAMP_FILE = '.timestamp';
// first num — minutes
const REQUESTS_INTERVAL = 60 * 60 * 1000;

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
        let logsElementLastTimestamp = 0;

        try {
            const timestampString = await fs.readFile(TIMESTAMP_FILE, {encoding: 'utf8'});
            logsElementLastTimestamp = Number(timestampString);
        } catch {}

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
            sourceIp: {},
        };

        for (const query of queries) {
            if (getUnixTime(parseJSON(query.timestamp)) <= logsElementLastTimestamp) {
                break;
            }

            const deviceName = devices.find(device => device.PK === query.deviceId).name;

            count(store.actionTrigger, `[${query.actionTrigger}] ${query.actionTriggerValue || ''} ${query.actionSpoofTarget ? `=> ${query.actionSpoofTarget}` : ''}`.trim());
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
            }
        }

        setLabels(this, store, [
            'actionTrigger',
            'answers',
            'deviceId',
            'protocol',
            'question',
            'rrType',
            'sourceGeoip',
            'sourceIp',
        ]);

        await fs.writeFile(TIMESTAMP_FILE, String(epoch).slice(0, -3));
    },
});
