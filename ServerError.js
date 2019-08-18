class ServerError extends Error {
  constructor(source, code = 500, message = 'ServerError!', ...params) {
    super(...params);
    if (Error.captureStackTrace) Error.captureStackTrace(this, ServerError);
    this.message = message;
    this.code = code;
    this.source = source;
  }
}
module.exports = ServerError;
