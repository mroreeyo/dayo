import { HttpException, HttpStatus } from '@nestjs/common';

export class OptimisticLockConflictException extends HttpException {
  constructor(message = 'Resource was modified by another request') {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: 'OPTIMISTIC_LOCK_CONFLICT',
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}
