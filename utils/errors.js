// errors.js
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Authentication Errors
  class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
      super(message, 401, 'AUTH_ERROR');
    }
  }
  
  class InvalidSignatureError extends AuthenticationError {
    constructor(message = 'Invalid signature') {
      super(message);
      this.errorCode = 'INVALID_SIGNATURE';
    }
  }
  
  class TokenError extends AuthenticationError {
    constructor(message = 'Token error') {
      super(message);
      this.errorCode = 'TOKEN_ERROR';
    }
  }
  
  // Registration Errors
  class RegistrationError extends AppError {
    constructor(message = 'Registration failed') {
      super(message, 400, 'REGISTRATION_ERROR');
    }
  }
  
  class DuplicateEmailError extends RegistrationError {
    constructor(message = 'Email already exists') {
      super(message);
      this.errorCode = 'DUPLICATE_EMAIL';
    }
  }
  
  class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
      super(message, 400, 'VALIDATION_ERROR');
    }
  }
  
  // Error handler middleware
  const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    // Log error for debugging (consider using a proper logging service in production)
    console.error('Error:', {
      message: err.message,
      status: err.status,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      stack: err.stack
    });
  
    if (process.env.NODE_ENV === 'development') {
      res.status(err.statusCode).json({
        status: err.status,
        error: {
          message: err.message,
          code: err.errorCode,
          stack: err.stack
        }
      });
    } else {
      // Production error response (without stack trace)
      res.status(err.statusCode).json({
        status: err.status,
        error: {
          message: err.message,
          code: err.errorCode
        }
      });
    }
  };
  
  export {
    AppError,
    AuthenticationError,
    InvalidSignatureError,
    TokenError,
    RegistrationError,
    DuplicateEmailError,
    ValidationError,
    errorHandler
  };