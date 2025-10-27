const logger = require("../utils/logger");

const errorHandler = async (err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "something went wrong",
  });
};

module.exports = errorHandler;
