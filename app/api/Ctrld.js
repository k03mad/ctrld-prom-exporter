import env from '../../env.js';

/** */
class Ctrld {

    constructor() {
        this.url = 'https://api.controld.com/';

        this.options = {
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${env.ctrld.token}`,
            },
        };
    }

    /**
     * @param {string} path
     * @returns {object}
     */
    async get(path) {
        const response = await fetch(this.url + path, this.options);

        const {body} = await response.json();
        return body;
    }

}
export default new Ctrld();
