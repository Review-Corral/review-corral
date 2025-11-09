/**
 * API types for frontend consumption
 * These match the Postgres database schema that the backend returns
 */

export interface User {
  id: number;
  login: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Organization {
  id: number;
  name: string;
  avatarUrl: string | null;
  installationId: number | null;
  type: string;
  stripeCustomerId: string | null;
  stripeSubscriptionStatus: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Member {
  orgId: number;
  userId: number;
  memberId: number; // Alias for userId
  name: string;
  email: string | null;
  avatarUrl: string | null;
  slackId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Repository {
  id: number;
  repoId: number; // Alias for id
  orgId: number;
  name: string;
  avatarUrl: string | null;
  isEnabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SlackIntegration {
  id: string;
  orgId: number;
  slackTeamId: string;
  slackTeamName: string;
  accessToken: string;
  channelId: string;
  channelName: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SlackUser {
  id: string;
  slackTeamId: string;
  slackUserId: string;
  realNameNormalized: string;
  isBot: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  email: string | null;
  image48: string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Subscription {
  id: string;
  orgId: number;
  customerId: string;
  subscriptionId: string;
  priceId: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
