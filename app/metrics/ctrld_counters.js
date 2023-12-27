/* eslint-disable unicorn/filename-case */

import Ctrld from '../api/ctrld.js';
import {getCurrentFilename} from '../helpers/paths.js';

export default {
    name: getCurrentFilename(import.meta.url),
    help: 'Options counters',
    labelNames: ['type'],

    async collect(ctx) {
        ctx.reset();

        const {profiles} = await Ctrld.profiles();
        const firstProfileId = profiles[0].PK;

        const [{options: opts}, {filters}, {filters: external}, {proxies}] = await Promise.all([
            Ctrld.profilesOptions(),
            Ctrld.profilesFilters(firstProfileId),
            Ctrld.profilesFiltersExternal(firstProfileId),
            Ctrld.proxies(),
        ]);

        ctx.labels('accountOptionsCount').set(opts.length);
        ctx.labels('nativeFiltersCount').set(filters.length);
        ctx.labels('externalFiltersCount').set(external.length);
        ctx.labels('proxiesCount').set(proxies.length);
    },
};
