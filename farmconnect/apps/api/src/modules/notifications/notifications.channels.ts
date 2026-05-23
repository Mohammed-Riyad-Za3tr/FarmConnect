import type { NotificationType } from '@prisma/client';

import { logger } from '../../core/logger';

interface ChannelPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

export async function sendEmailPlaceholder(payload: ChannelPayload): Promise<void> {
  logger.info({ payload }, '[notifications] EMAIL placeholder dispatch');
}

export async function sendSmsPlaceholder(payload: ChannelPayload): Promise<void> {
  logger.info({ payload }, '[notifications] SMS placeholder dispatch');
}

export async function sendPushPlaceholder(payload: ChannelPayload): Promise<void> {
  logger.info({ payload }, '[notifications] PUSH placeholder dispatch');
}
