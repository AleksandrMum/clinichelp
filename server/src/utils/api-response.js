function success(res, data, meta = null, statusCode = 200) {
  return res.status(statusCode).json({
    data,
    meta,
    error: null
  });
}

module.exports = {
  success
};
