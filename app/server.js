import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import env from '../env.js';
import {log} from './helpers/logging.js';
import register from './prom.js';

const app = express();

if (env.server.logs) {
    app.use(morgan('combined'));
}

app.use(helmet());
app.use(compression());
app.use(express.json());

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.listen(env.server.port, () => env.server.logs && log(`port: ${env.server.port}`));
