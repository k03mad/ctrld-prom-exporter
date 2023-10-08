import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const QUERIES_TS_INTERVAL = 60 * 60 * 1000;
const SEPARATOR = ' :: ';

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
            actionSpoofTarget: {},
            actionSpoofTargetDevice: {},
            answersCountry: {},
            answersCity: {},
            answersIsp: {},
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
            questionDomainFirst: {},
            questionDomainSecond: {},
        };

        queries.forEach(query => {
            const deviceName = devices.find(device => device.PK === query.deviceId)?.name;
            const addDevice = text => [text, deviceName || 'unknown'].join(SEPARATOR);

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
                const triggerValue = [
                    query.actionTrigger,
                    query.actionTriggerValue,
                ].filter(Boolean).join(SEPARATOR);

                count(store.actionTriggerValue, triggerValue);
                count(store.actionTriggerValueDevice, addDevice(triggerValue));
            }

            if (query.actionSpoofTarget) {
                const spoofTarget = [
                    query.actionTrigger,
                    query.actionTriggerValue,
                    query.actionSpoofTarget,
                ].filter(Boolean).join(SEPARATOR);

                count(store.actionSpoofTarget, spoofTarget);
                count(store.actionSpoofTargetDevice, addDevice(spoofTarget));
            }

            if (query.answers?.some(elem => elem.geoip?.countryCode)) {
                const answers = query.answers
                    .filter(elem => elem.geoip?.countryCode)
                    .flatMap(elem => ({country: elem.geoip.countryCode}));

                answers.forEach(answer => count(store.answersCountry, answer.country));
            }

            if (query.answers?.some(elem => elem.geoip?.city)) {
                const answers = query.answers
                    .filter(elem => elem.geoip?.city)
                    .flatMap(elem => ({geoip: `${elem.geoip?.countryCode || ''} ${elem.geoip.city}`.trim()}));

                answers.forEach(answer => count(store.answersCity, answer.geoip));
            }

            if (query.answers?.some(elem => elem.geoip?.isp)) {
                const answers = query.answers
                    .filter(elem => elem.geoip?.isp)
                    .flatMap(elem => ({isp: elem.geoip.isp}));

                answers.forEach(answer => count(store.answersIsp, answer.isp));
            }

            if (query.sourceGeoip?.countryCode) {
                count(store.sourceGeoip, `${query.sourceGeoip.countryCode} ${query.sourceGeoip.city || ''}`.trim());
                count(store.sourceGeoipDevice, addDevice(`${query.sourceGeoip.countryCode}${query.sourceGeoip.city ? ` ${query.sourceGeoip.city}` : ''}`));
            }

            if (query.sourceGeoip?.isp) {
                count(store.sourceIsp, query.sourceGeoip.isp);
                count(store.sourceIspDevice, addDevice(query.sourceGeoip.isp));
            }

            if (query.question?.includes('.')) {
                const splitted = query.question.split('.');
                const firstDomain = splitted.at(-1);
                const secondDomain = splitted.at(-2);

                count(store.questionDomainFirst, firstDomain);
                count(store.questionDomainSecond, `${secondDomain}.${firstDomain}`);
            }
        });

        Object.entries(store).forEach(([label, data]) => {
            Object.entries(data).forEach(([name, value]) => {
                ctx.labels(label, name).set(value);
            });
        });
    },
};
