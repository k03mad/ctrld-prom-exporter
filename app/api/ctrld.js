import {request, requestCache} from '@k03mad/request';

import env from '../../env.js';
import {epochWeekAgo} from '../helpers/time.js';

/** */
class Ctrld {

    constructor() {
        this.urls = {
            api: 'https://api.controld.com/',
            analytics: 'https://analytics.controld.com/',
        };

        this.options = {
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${env.ctrld.token}`,
            },
        };
    }

    /**
     * @param {object} opts
     * @param {string} opts.path
     * @param {string} [opts.url]
     * @param {object} [opts.options]
     * @returns {object}
     */
    async _get({options = {}, path, url = this.urls.api}) {
        const {body: {body}} = await request(url + path, {
            ...this.options,
            ...options,
        });

        return body;
    }

    /**
     * @param {object} opts
     * @param {string} opts.path
     * @param {string} [opts.url]
     * @param {object} [opts.options]
     * @param {number} [opts.expire]
     * @returns {object}
     */
    async _getCache({expire = 3600, options = {}, path, url = this.urls.api}) {
        const {body: {body}} = await requestCache(url + path, {
            ...this.options,
            ...options,
        }, {expire});

        return body;
    }

    /**
     * @param {object} [opts]
     * @param {string} [opts.report]
     * @param {number} [opts.startTs]
     * @param {string} [opts.tz]
     * @returns {object}
     */
    getReport({report, startTs = epochWeekAgo(), tz = 'Europe/Moscow'} = {}) {
        return this._get({
            url: this.urls.analytics,
            path: `reports/dns-queries/${report}/pie-chart`,
            options: {
                searchParams: {
                    startTs,
                    tz,
                },
            },
        });
    }

    devices() {
        return this._get({path: 'devices'});
    }

    devicesCache() {
        return this._getCache({path: 'devices', expire: 600});
    }

    profiles() {
        return this._getCache({path: 'profiles'});
    }

    profilesOptions() {
        return this._getCache({path: 'profiles/options'});
    }

    profilesFilters(profile) {
        return this._getCache({path: `profiles/${profile}/filters`});
    }

    profilesFiltersExternal(profile) {
        return this._getCache({path: `profiles/${profile}/filters/external`});
    }

    proxies() {
        return this._getCache({path: 'proxies'});
    }

    async queries({endTs, pageSize = 500, pages = 5, startTs} = {}) {
        let output;

        const searchParams = {
            endTs,
            startTs,
            pageSize,
        };

        for (let i = 0; i < pages; i++) {
            const requestData = {
                url: this.urls.analytics,
                path: 'queries/historical',
                options: {searchParams},
            };

            if (i === 0) {
                output = await this._get(requestData);
            } else {
                searchParams.page = i;
                const {queries} = await this._get(requestData);

                if (queries.length === 0) {
                    break;
                }

                output.queries.push(...queries);
            }
        }

        return output;
    }

}
export default new Ctrld();
