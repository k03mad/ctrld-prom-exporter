import {request, requestCache} from '@k03mad/request';
import * as cheerio from 'cheerio';

import env from '../../env.js';
import {epochWeekAgo} from '../helpers/time.js';

/** */
class Ctrld {

    constructor() {
        this.urls = {
            api: 'https://api.controld.com/',
            analytics: 'https://europe.analytics.controld.com/',
            docs: 'https://docs.controld.com/',
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
     * @returns {Promise<object>}
     */
    async _get({options = {}, path, url = this.urls.api}) {
        const {body} = await request(url + path, {
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
     * @returns {Promise<object>}
     */
    async _getCache({expire = 3600, options = {}, path, url = this.urls.api}) {
        const {body} = await requestCache(url + path, {
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
     * @returns {Promise<object>}
     */
    async getReportPie({report, startTs = epochWeekAgo(), tz = 'Europe/Moscow'} = {}) {
        const {body} = await this._get({
            url: this.urls.analytics,
            path: `reports/dns-queries/${report}/pie-chart`,
            options: {
                searchParams: {
                    startTs,
                    tz,
                },
            },
        });

        return body;
    }

    /**
     * @param {object} [opts]
     * @param {string} [opts.report]
     * @param {number} [opts.startTs]
     * @param {string} [opts.tz]
     * @param {string} [opts.granularity]
     * @returns {Promise<object>}
     */
    async getReportTime({granularity = 'day', report, startTs = epochWeekAgo(), tz = 'Europe/Moscow'} = {}) {
        const {body} = await this._get({
            url: this.urls.analytics,
            path: `reports/dns-queries/${report}/time-series`,
            options: {
                searchParams: {
                    startTs,
                    tz,
                    granularity,
                },
            },
        });

        return body;
    }

    /**
     * @returns {Promise<object>}
     */
    async devices() {
        const {body} = await this._get({path: 'devices'});
        return body;
    }

    /**
     * @returns {Promise<object>}
     */
    async devicesCache() {
        const {body} = await this._getCache({path: 'devices', expire: 600});
        return body;
    }

    /**
     * @returns {Promise<object>}
     */
    async profiles() {
        const {body} = await this._getCache({path: 'profiles'});
        return body;
    }

    /**
     * @returns {Promise<object>}
     */
    async profilesOptions() {
        const {body} = await this._getCache({path: 'profiles/options'});
        return body;
    }

    /**
     * @param {string} profile
     * @returns {Promise<object>}
     */
    async profilesFilters(profile) {
        const {body} = await this._getCache({path: `profiles/${profile}/filters`});
        return body;
    }

    /**
     * @param {string} profile
     * @returns {Promise<object>}
     */
    async profilesFiltersExternal(profile) {
        const {body} = await this._getCache({path: `profiles/${profile}/filters/external`});
        return body;
    }

    /**
     * @returns {Promise<object>}
     */
    async proxies() {
        const {body} = await this._getCache({path: 'proxies'});
        return body;
    }

    /**
     * @param {object} opts
     * @param {number} opts.endTs
     * @param {number} [opts.pageSize]
     * @param {number} [opts.pages]
     * @param {number} opts.startTs
     * @returns {Promise<Array<object>>}
     */
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
                ({body: output} = await this._get(requestData));
            } else {
                searchParams.page = i;
                const {body: {queries}} = await this._get(requestData);

                if (queries.length === 0) {
                    break;
                }

                output.queries.push(...queries);
            }
        }

        return output;
    }

    /**
     * @returns {Promise<{versions: Array, changelogs: Array}>}
     */
    async changelog() {
        const html = await this._getCache({
            url: this.urls.docs,
            path: 'changelog',
            options: {
                searchParams: {
                    json: 'on',
                },
                headers: {},
            },
        });

        const $ = cheerio.load(html);
        return {
            versions: $('[class^=ChangelogPost_title]').get().map(elem => $(elem).text()),
            changelogs: $('[class*=ChangelogPost_text]').get().map(elem => $(elem).text()),
        };
    }

}
export default new Ctrld();
