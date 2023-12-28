import Ctrld from '../api/ctrld.js';
import {count} from '../helpers/object.js';
import {getCurrentFilename} from '../helpers/paths.js';

// first num — minutes
const QUERIES_TS_INTERVAL = 60 * 60 * 1000;
const SEPARATOR = ' :: ';

const THIRD_PARTY_FILTERS_STARTS_WITH = 'x-';

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
            actionTriggerFull: {},
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

            if (deviceName) {
                const formatString = (...texts) => [...new Set(texts.flat())]
                    .filter(Boolean)
                    .join(SEPARATOR);

                count(store.actionTrigger, query.actionTrigger);
                count(store.actionTriggerDevice, formatString(query.actionTrigger, deviceName));
                count(store.deviceId, deviceName);
                count(store.protocol, query.protocol);
                count(store.protocolDevice, formatString(query.protocol, deviceName));
                count(store.rrType, query.rrType);
                count(store.rrTypeDevice, formatString(query.rrType, deviceName));
                count(store.sourceIp, query.sourceIp);
                count(store.sourceIpDevice, formatString(query.sourceIp, deviceName));

                if (query.actionTriggerValue) {
                    const triggerValue = [
                        query.actionTrigger,
                        query.actionTriggerValue,
                    ];

                    count(store.actionTriggerValue, formatString(triggerValue));
                    count(store.actionTriggerValueDevice, formatString(triggerValue, deviceName));

                    if (
                        query.actionTrigger === 'filter'
                        && !query.actionTriggerValue.startsWith(THIRD_PARTY_FILTERS_STARTS_WITH)
                    ) {
                        count(store.actionTriggerFull, formatString(triggerValue, query.question, deviceName));
                    }
                }

                if (query.actionSpoofTarget) {
                    const spoofTarget = [
                        query.actionTrigger,
                        query.actionTriggerValue,
                        query.actionSpoofTarget,
                    ];

                    count(store.actionSpoofTarget, formatString(spoofTarget));
                    count(store.actionSpoofTargetDevice, formatString(spoofTarget, deviceName));

                    if (query.actionTrigger === 'custom') {
                        count(store.actionTriggerFull, formatString(spoofTarget, query.question, deviceName));
                    }
                }

                if (query.sourceGeoip?.countryCode) {
                    count(store.sourceGeoip, formatString(query.sourceGeoip.countryCode, query.sourceGeoip.city));
                    count(store.sourceGeoipDevice, formatString(query.sourceGeoip.countryCode, query.sourceGeoip.city, deviceName));
                }

                if (query.sourceGeoip?.isp) {
                    count(store.sourceIsp, query.sourceGeoip.isp);
                    count(store.sourceIspDevice, formatString(query.sourceGeoip.isp, deviceName));
                }

                if (query.question?.includes('.')) {
                    const splitted = query.question.split('.');
                    const firstDomain = splitted.at(-1);
                    const secondDomain = splitted.at(-2);

                    count(store.questionDomainFirst, firstDomain);
                    count(store.questionDomainSecond, `${secondDomain}.${firstDomain}`);
                }

                if (query.answers?.some(elem => elem.geoip?.countryCode)) {
                    const answers = query.answers
                        .filter(elem => elem.geoip?.countryCode)
                        .flatMap(elem => ({country: elem.geoip.countryCode}));

                    answers.forEach(answer => count(store.answersCountry, answer.country));
                }

                if (query.answers?.some(elem => elem.geoip?.isp)) {
                    const answers = query.answers
                        .filter(elem => elem.geoip?.isp)
                        .flatMap(elem => ({isp: elem.geoip.isp}));

                    answers.forEach(answer => count(store.answersIsp, answer.isp));
                }
            }
        });

        Object.entries(store).forEach(([label, data]) => {
            Object.entries(data).forEach(([name, value]) => {
                ctx.labels(label, name).set(value);
            });
        });
    },
};
