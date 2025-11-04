// src/services/sqs.service.ts
import { env } from '@/env';
import logger from '../logger';
import { sqs } from './aws.config';

type QueueName = 'OTP_QUEUE';

const QUEUE_URLS: Record<QueueName, string> = {
  OTP_QUEUE: env.AWS_SQS_OTP_QUEUE_URL as string,
  //   AI_REPORT_QUEUE: env.AWS_SQS_AI_REPORT_QUEUE_URL,
};

export const sendMessageToQueue = async (queue: QueueName, messageBody: Record<string, string | number | boolean>) => {
  try {
    const params = {
      QueueUrl: QUEUE_URLS[queue],
      MessageBody: JSON.stringify(messageBody),
    };

    const result = await sqs.sendMessage(params).promise();
    logger.info(`[SQS] Message sent to ${queue}:`, result.MessageId);
    return result;
  } catch (error) {
    logger.error(`[SQS] Failed to send message to ${queue}:`, error);
    throw error;
  }
};
