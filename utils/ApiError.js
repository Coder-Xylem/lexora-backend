// ApiError.js
class ApiError extends Error {
    constructor(message, code = 'API_ERROR', details = {}) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.details = details;
    }
  
    // Optional helper to format error as string (e.g., for logging)
    toString() {
      return `${this.name} (${this.code}): ${this.message} ${JSON.stringify(this.details)}`;
    }
  }
  
  module.exports = ApiError;
  