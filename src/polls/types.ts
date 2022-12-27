import { Request } from 'express';
import { Socket } from 'socket.io';
import { Nomination } from 'src/types/poll-types';

//services types
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddParticipantFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
};

export type SubmitRankingsFields = {
  pollID: string;
  userID: string;
  rankings: string[];
};

// repository types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddNominationData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
};

export type RemoveParticipantData = {
  pollID: string;
  userID: string;
};

export type AddParticipantRankingsData = {
  pollID: string;
  userID: string;
  rankings: string[];
};

//Request types
export type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};

export type RequestWithAuth = Request & AuthPayload;

export type SocketWithAuth = Socket & AuthPayload;
