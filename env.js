import {codeText, errorText} from './app/helpers/colors.js';

const TOKEN_ENV_NAME = 'CTRLD_API_TOKEN';
const TOKEN_NPM_PARAM_NAME = 'token';

const env = {
    server: {
        logs: process.env.CTRLD_EXPORTER_LOGS
           || process.env.npm_config_logs,
        port: process.env.npm_config_port
           || process.env.CTRLD_EXPORTER_PORT
           || 11_009,
    },
    ctrld: {
        token: process.env[TOKEN_ENV_NAME]
           || process.env[`npm_config_${TOKEN_NPM_PARAM_NAME}`],
    },
};

if (!env.ctrld.token) {
    throw new Error([
        errorText(' Ctrld API token is not specified '),
        `> use env variable: ${codeText(TOKEN_ENV_NAME)}`,
        `> or npm parameter: ${codeText(`--${TOKEN_NPM_PARAM_NAME}`)}`,
        '> see readme',
    ].join('\n'));
}

export default env;
