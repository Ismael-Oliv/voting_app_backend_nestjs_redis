import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsUnauthorizedException } from 'src/exceptions/ws-exceptions';
import { PollsService } from '../services/polls.services';
import { AuthPayload, SocketWithAuth } from '../types';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAdminGuard.name);
  private readonly jwtService: JwtService;
  private readonly pollsSerivce: PollsService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: SocketWithAuth = context.switchToWs().getClient();

    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      this.logger.error('No authorization token provider');

      throw new WsUnauthorizedException('No token provider');
    }

    try {
      const payload = this.jwtService.verify<AuthPayload & { sub: string }>(
        token,
      );

      this.logger.debug(`Validating admin using token payload:`, payload);

      const { sub, pollID } = payload;

      const poll = await this.pollsSerivce.getPoll(pollID);

      if (sub !== poll.adminID) {
        throw new WsUnauthorizedException('Admin privileges required');
      }

      return true;
    } catch (error) {
      throw new WsUnauthorizedException('Admin privilages required ');
    }
  }
}
