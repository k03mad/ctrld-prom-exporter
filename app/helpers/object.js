/**
 * @param {object} obj
 * @param {string} key
 * @param {string|number} start
 */
export const count = (obj, key, start = 1) => {
    obj[key] = obj[key] ? obj[key] + Number(start) : Number(start);
};
