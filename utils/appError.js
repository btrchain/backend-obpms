class AppError extends Error {
    constructor(message,statusCode,status){
      super(message,statusCode,status)


      this.statusCode =statusCode;
      this.status =status
      Error.captureStackTrace(this,this.constructor)
    }
}

module.exports = AppError