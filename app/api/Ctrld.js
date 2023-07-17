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

    queries({endTs, pageSize = 500, startTs} = {}) {
        return this._get({
            url: this.urls.analytics,
            path: 'queries/historical',
            options: {
                searchParams: {
                    endTs,
                    startTs,
                    pageSize,
                },
            },
        });
    }

}
export default new Ctrld();
