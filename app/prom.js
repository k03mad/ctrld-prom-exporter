import {createRequire} from 'node:module';
import os from 'node:os';

import client from 'prom-client';

import env from '../env.js';
import metrics from './metrics/_index.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package');

const register = new client.Registry();

const labels = {
    app: packageJson.name,
    host: os.hostname,
    port: env.server.port,
};

register.setDefaultLabels(labels);

Object
    .values(metrics)
    .forEach(metric => register.registerMetric(metric));

export default register;
