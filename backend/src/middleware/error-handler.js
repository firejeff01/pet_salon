function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? '伺服器內部錯誤' : err.message;

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: message,
    },
  });
}

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
