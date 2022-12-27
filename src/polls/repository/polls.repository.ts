import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Poll, Results } from '../../types/poll-types';
import {
  AddNominationData,
  AddParticipantData,
  CreatePollData,
  AddParticipantRankingsData,
} from '../types';

@Injectable()
export class PollsRepository {
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject('IORedis') private readonly redisClient: ReturnType<() => Redis>,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }

  async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll: Poll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      adminID: userID,
      rankings: {},
      results: [],
      hasStarted: false,
      nominations: {},
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`;

    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      const currentPoll = (await this.redisClient.call(
        'JSON.GET',
        key,
        '.',
      )) as string;

      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll);
    } catch (e) {
      throw new InternalServerErrorException(`Failed to get pollID: ${pollID}`);
    }
  }

  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.call(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException(
        `Failed to add participant: ${userID}`,
      );
    }
  }

  async removeParticipant(pollID: string, userID: string): Promise<void> {
    this.logger.log(`removing userID: ${userID} from poll: ${pollID}`);

    const key = `polls: ${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.call('JSON.Del', key, participantPath);
    } catch (e) {
      this.logger.error(
        `Failed to remove userID: ${userID} from poll: ${pollID}`,
      );

      throw new InternalServerErrorException('Failed to remove participant', e);
    }
  }

  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationData): Promise<Poll> {
    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.call(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return await this.getPoll(pollID);
    } catch (e) {
      throw new InternalServerErrorException(
        `Failed to add a nomination with nominationID/text: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
      );
    }
  }

  async startPoll(pollID: string): Promise<Poll> {
    const key = `polls:${pollID}`;

    try {
      await this.redisClient.call(
        'JSON.SET',
        key,
        '.hasStarted',
        JSON.stringify(true),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(`Failed set hasStarted for poll: ${pollID}`, e);
      throw new InternalServerErrorException(
        `Failed set hasStarted for poll: ${pollID}`,
      );
    }
  }

  async addParticipantRankings({
    pollID,
    userID,
    rankings,
  }: AddParticipantRankingsData): Promise<Poll> {
    const key = `polls:${pollID}`;
    const rankingsPath = `.rankings.${userID}`;

    try {
      await this.redisClient.call(
        'JSON.SET',
        key,
        rankingsPath,
        JSON.stringify(rankings),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a rankings for userID/name: ${userID}/ to pollID: ${pollID}`,
        rankings,
      );
      throw new InternalServerErrorException(
        'There was an error starting the poll',
      );
    }
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.call('JSON.DEL', key, nominationPath);

      return await this.getPoll(pollID);
    } catch (e) {
      throw new InternalServerErrorException(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
      );
    }
  }

  async addResults(pollID: string, results: Results): Promise<Poll> {
    const key = `polls:${pollID}`;
    const resultsPath = `.results`;

    try {
      await this.redisClient.call(
        'JSON.SET',
        key,
        resultsPath,
        JSON.stringify(results),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(`Failed to add results for ${pollID}`, results);
      throw new InternalServerErrorException(
        `Failed to add results for pollID: ${pollID}`,
      );
    }
  }

  async deletePoll(pollID: string): Promise<void> {
    const key = `polls:${pollID}`;

    try {
      await this.redisClient.call('JSON.Del', key);
    } catch (e) {
      this.logger.error(`Failed to delete poll: ${pollID}`, e);
      throw new InternalServerErrorException(
        `Failed to delete poll: ${pollID}`,
      );
    }
  }
}
