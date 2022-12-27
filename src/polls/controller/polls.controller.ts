import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { PollsService } from '../services/polls.services';
import { CreatePollDto, JoinPollDto } from '../dtos';
import { ControllerAuthGuard } from '../guards/cotroller-auth.guard';
import { RequestWithAuth } from '../types';
import { ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@UsePipes(new ValidationPipe())
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsServices: PollsService) {}

  @Post('/')
  async create(@Body() createPollDto: CreatePollDto) {
    const result = await this.pollsServices.createPoll(createPollDto);
    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    const result = await this.pollsServices.joinPoll(joinPollDto);
    return result;
  }

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() { name, pollID, userID }: RequestWithAuth) {
    const result = await this.pollsServices.rejoinPoll({
      name,
      pollID,
      userID,
    });
    return result;
  }
}
