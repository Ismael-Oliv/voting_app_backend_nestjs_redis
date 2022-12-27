import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { jwtModuleConfig } from '../jwt/jwt.module';
import { redisModuleConfig } from '../redis/modules.config';
import { PollsController } from './controller/polls.controller';
import { PollsGateway } from './gateway/polls.gateway';
import { PollsRepository } from './repository/polls.repository';
import { PollsService } from './services/polls.services';

@Module({
  imports: [ConfigModule, redisModuleConfig, jwtModuleConfig],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository, PollsGateway],
})
export class PollsModule {}
