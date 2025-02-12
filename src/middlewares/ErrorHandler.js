const ErrorHandler = (err, req, res, next) => {
    const errStatus = err.statusCode || err.status || 500;
    const errMsg = err.message || 'Something went wrong';
    if( errStatus === 500) {
        console.error(errMsg);
    }
    res.status(errStatus).json({
        status: 'error',
        message: errMsg,
        errorCode: err.errorCode,
        errors: errStatus === 500 ? [] : err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    })
}
module.exports = ErrorHandler;