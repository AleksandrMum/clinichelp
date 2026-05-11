const { AppError } = require('../common/errors/app-error');

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @returns {string}
 */
function nonEmptyTrimmedString(value, fieldName) {
  if (value === undefined || value === null) {
    throw AppError.badRequest(`${fieldName} is required`);
  }
  const s = String(value).trim();
  if (!s) {
    throw AppError.badRequest(`${fieldName} cannot be empty`);
  }
  return s;
}

/**
 * For optional text fields: trim; empty string becomes null.
 * `undefined` means "omit from patch" when used in update flows — caller decides.
 * @param {unknown} value
 * @returns {string|null|undefined}
 */
function optionalTrimmedNullable(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

module.exports = {
  nonEmptyTrimmedString,
  optionalTrimmedNullable
};
