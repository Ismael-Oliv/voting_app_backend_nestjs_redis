import { WsException } from '@nestjs/websockets';

type WsExceptionType = 'BadRequest' | 'Unauthirized' | 'Unknown';

export class WsTypeException extends WsException {
  readonly type: WsExceptionType;

  constructor(type: WsExceptionType, message: string | any) {
    const error = { type, message };

    super(error);
    this.type = type;
  }
}

export class WsBadRequestException extends WsTypeException {
  constructor(message: string | any) {
    super('BadRequest', message);
  }
}

export class WsUnauthorizedException extends WsTypeException {
  constructor(message: string | any) {
    super('Unauthirized', message);
  }
}

export class WsUnknownException extends WsTypeException {
  constructor(message: string | any) {
    super('Unknown', message);
  }
}
