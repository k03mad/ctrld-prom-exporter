import got from 'got';

import env from '../../env.js';

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
        const {body} = await got(url + path, {
            ...this.options,
            ...options,
        }).json();

        return body;
    }

    devices() {
        return this._get({path: 'devices'});
    }

    profiles() {
        return this._get({path: 'profiles'});
    }

    profilesOptions() {
        return this._get({path: 'profiles/options'});
    }

    profilesFilters(profile) {
        return this._get({path: `profiles/${profile}/filters`});
    }

    profilesFiltersExternal(profile) {
        return this._get({path: `profiles/${profile}/filters/external`});
    }

    proxies() {
        return this._get({path: 'proxies'});
    }

    async queries({endTs, pageSize = 500, pages = 1, startTs} = {}) {
        let output;

        const searchParams = {
            endTs,
            startTs,
            pageSize,
        };

        for (let i = 0; i < pages; i++) {
            const request = {
                url: this.urls.analytics,
                path: 'queries/historical',
                options: {searchParams},
            };

            if (i === 0) {
                output = await this._get(request);
            } else {
                searchParams.page = i;
                const {queries} = await this._get(request);
                output.queries.push(...queries);
            }
        }

        return output;
    }

}
export default new Ctrld();
