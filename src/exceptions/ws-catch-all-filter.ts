import {
  ArgumentsHost,
  BadRequestException,
  ExceptionFilter,
} from '@nestjs/common';
import { SocketWithAuth } from 'src/polls/types';
import {
  WsBadRequestException,
  WsTypeException,
  WsUnknownException,
} from './ws-exceptions';

export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (exception instanceof BadRequestException) {
      const exceptionData = exception.getResponse();

      const wsException = new WsBadRequestException(
        exceptionData['message'] ?? 'Bad Request',
      );

      socket.emit('exception', wsException.getError());

      return;
    }

    if (exception instanceof WsTypeException) {
      socket.emit('exception', exception.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit('exception', wsException.getError());
  }
}
