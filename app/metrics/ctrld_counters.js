import client from 'prom-client';

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default new client.Gauge({
    name: getCurrentFilename(import.meta.url),
    help: 'Options counters',
    labelNames: ['type'],

    async collect() {
        this.reset();

        const {profiles} = await Ctrld.profiles();
        const firstProfileId = profiles[0].PK;

        const [{options}, {filters}, {filters: external}, {proxies}] = await Promise.all([
            Ctrld.profilesOptions(),
            Ctrld.profilesFilters(firstProfileId),
            Ctrld.profilesFiltersExternal(firstProfileId),
            Ctrld.proxies(),
        ]);

        this.labels('accountOptionsCount').set(options.length);
        this.labels('nativeFiltersCount').set(filters.length);
        this.labels('externalFiltersCount').set(external.length);
        this.labels('proxiesCount').set(proxies.length);
    },
});
