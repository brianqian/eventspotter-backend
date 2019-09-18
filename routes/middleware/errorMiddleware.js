const logAndHandleError = (err, req, res, next) => {
  console.log('LOGGING ERROR ⚠️');
  console.error('Server Error');
  console.error('Code: ', err.code);
  console.error('Source: ', err.source);
  // console.error('Stack Trace: ', err.stack);
  console.error('Path:', req.path);
  res.sendStatus(err.code || 500);
  next(err);
};

const catchAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { logAndHandleError, catchAsyncError };
