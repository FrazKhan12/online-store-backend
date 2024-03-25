class AppError extends Error {
  constructor(message, statusCode, additionalData = null) {
    // super is used to call constructor of parent class
    super(message);
    this.statusCode = statusCode;
    this.additionalData = additionalData;
    this.status = `${statusCode}`.startsWith("4") ? "failed" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
