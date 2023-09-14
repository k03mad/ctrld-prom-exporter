import os from 'node:os';

import client from 'prom-client';

import env from '../env.js';
import {errorText} from './helpers/colors.js';
import {logPlainError} from './helpers/logging.js';
import {packageJson} from './helpers/parse.js';
import metrics from './metrics/_index.js';

const register = new client.Registry();

register.setDefaultLabels({
    app: packageJson.name,
    host: os.hostname,
    port: env.server.port,
});

Object
    .values(metrics)
    .forEach(metric => {
        const {collect, name, ...rest} = metric;

        const gauge = new client.Gauge({
            name,
            ...rest,
            async collect() {
                try {
                    await collect(this);
                } catch (err) {
                    logPlainError([
                        `${new Date().toISOString()} [${name}]`,
                        errorText(err),
                    ]);
                }
            },
        });

        register.registerMetric(gauge);
    });

export default register;
