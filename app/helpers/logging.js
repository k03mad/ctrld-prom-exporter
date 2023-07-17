import {convertToArray} from './array.js';

/* eslint-disable no-console */
/**
 * @param {any|any[]} msg
 * @returns {void}
 */
export const log = msg => console.log(convertToArray(msg).join('\n'));
