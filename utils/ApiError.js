class ApiError extends Error {
    constructor(message, code = 'API_ERROR', details = {}) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.details = details;
    }
  
    toString() {
      return `${this.name} (${this.code}): ${this.message} ${JSON.stringify(this.details)}`;
    }
  }
  
  module.exports = ApiError;
  