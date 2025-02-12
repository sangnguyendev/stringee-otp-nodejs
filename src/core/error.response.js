'use strict';

const StatusCode = {
    BADREQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOTFOUND: 404,
    CONFLICT: 409
}

const ReasonStatusCode = {
    BADREQUEST: 'Bad Request',
    FORBIDDEN: 'Access Denied',
    CONFLICT: 'Conflict error',
    UNAUTHORIZED: 'Unauthorized',
}

class ErrorResponse extends Error {
    constructor(message, status, errorCode, errors = []) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.errors = errors;
    }
}

class ConflictRequestError extends ErrorResponse {

    constructor(message = ReasonStatusCode.CONFLICT, errorCode = '00', errors = []) {

        super(message,  StatusCode.CONFLICT, errorCode, errors);

    }

}

class ForbiddenError extends ErrorResponse {

    constructor(message = ReasonStatusCode.FORBIDDEN, errorCode = '00', errors = []) {

        super(message, StatusCode.FORBIDDEN, errorCode, errors);

    }

}
class BadRequestError extends ErrorResponse {

    constructor(message = ReasonStatusCode.BADREQUEST, errorCode = '00', errors = []) {

        super(message, StatusCode.BADREQUEST, errorCode, errors);

    }

}
class UnauthorizedError extends ErrorResponse {

    constructor(message = ReasonStatusCode.UNAUTHORIZED, errorCode = '00', errors = []) {

        super(message, StatusCode.UNAUTHORIZED,  errorCode, errors);

    }

}

class NotFoundError extends ErrorResponse {

    constructor(message = ReasonStatusCode.NOTFOUND, statusCode = StatusCode.NOTFOUND) {

        super(message, statusCode);

    }

}

module.exports = {
    ForbiddenError,
    ConflictRequestError,
    BadRequestError,
    UnauthorizedError,
    NotFoundError
}