import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const QUERIES_TS_INTERVAL = 60 * 60 * 1000;

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
            actionTriggerValue: {},
            actionTriggerValueDevice: {},
            actionTriggerDomain: {},
            actionTriggerDomainDevice: {},
            actionSpoofTarget: {},
            actionSpoofTargetDevice: {},
            answers: {},
            answersCity: {},
            deviceId: {},
            protocol: {},
            protocolDevice: {},
            rrType: {},
            rrTypeDevice: {},
            sourceGeoip: {},
            sourceGeoipDevice: {},
            sourceIp: {},
            sourceIpDevice: {},
            sourceIsp: {},
            sourceIspDevice: {},
        };

        queries.forEach(query => {
            const deviceName = devices.find(device => device.PK === query.deviceId)?.name;
            const addDevice = text => `${text} :: ${deviceName}`;

            count(store.actionTrigger, query.actionTrigger);
            count(store.actionTriggerDevice, addDevice(query.actionTrigger));
            count(store.deviceId, deviceName);
            count(store.protocol, query.protocol);
            count(store.protocolDevice, addDevice(query.protocol));
            count(store.rrType, query.rrType);
            count(store.rrTypeDevice, addDevice(query.rrType));
            count(store.sourceIp, query.sourceIp);
            count(store.sourceIpDevice, addDevice(query.sourceIp));

            if (query.actionTriggerValue) {
                count(store.actionTriggerValue, query.actionTriggerValue);
                count(store.actionTriggerValueDevice, addDevice(query.actionTriggerValue));
            }

            if (query.actionSpoofTarget) {
                count(store.actionSpoofTarget, query.actionSpoofTarget);
                count(store.actionSpoofTargetDevice, addDevice(query.actionSpoofTarget));
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
                count(store.sourceGeoipDevice, addDevice(`${query.sourceGeoip.countryCode}${query.sourceGeoip.city ? ` ${query.sourceGeoip.city}` : ''}`));
            }

            if (query.sourceGeoip.isp) {
                count(store.sourceIsp, query.sourceGeoip.isp);
                count(store.sourceIspDevice, addDevice(query.sourceGeoip.isp));
            }
        });

        Object.entries(store).forEach(([label, data]) => {
            Object.entries(data).forEach(([name, value]) => {
                ctx.labels(label, name).set(value);
            });
        });
    },
};
