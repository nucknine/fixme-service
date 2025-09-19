import 'express-async-errors';
import http from 'http';

import { winstonLogger } from '@nucknine/fixme-shared';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import { Application } from 'express';
import { healthRoutes } from '@notifications/routes';
import { checkConnection } from '@notifications/elasticsearch';
import { Channel } from 'amqplib';
import { createConnection } from '@notifications/queues/connection';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '@notifications/queues/email.consumer';

// API gateway PORT - 4000
// Notification service PORT - 4001
const SERVER_PORT = 4001;
// sends notification service logs to ES (go to http://localhost:5601/ to check)
/**
 *
 * standart Winston log :
 * {
 *   "message": "Some message",
 *   "level": "info",
 *   "meta": {
 *     "method": "GET",
 *     "url": "/sitemap.xml"
 *   }
 * }
 * transforms to ES:
 *
 * {
 *   "@timestamp": "2023-09-10T12:00:00.000Z",
 *   "message": "Some message",
 *   "severity": "info",
 *   "fields": {
 *     "method": "GET",
 *     "url": "/sitemap.xml"
 *   }
 * }
 */
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application): void {
  startServer(app);
  // http://localhost:4001/notification-health
  app.use('', healthRoutes());
  startQueues();
  startElasticSearch();
}

async function startQueues(): Promise<void> {
  const emailChannel: Channel | undefined = await createConnection();
  console.log('%c🤪 ~ file: server.ts:52 [] -> emailChannel : ', 'color: #404699', emailChannel);

    await consumeAuthEmailMessages(emailChannel);
    await consumeOrderEmailMessages(emailChannel);

}

function startElasticSearch(): void {
  checkConnection();
}

function startServer(app: Application): void {
  try {
    const httpServer: http.Server = new http.Server(app);
    // send log to Console with color and send to ES in apropriate format
    log.info(`Worker with process id of ${process.pid} on notification server has started`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'NotificationService startServer() method:', error);
  }
}