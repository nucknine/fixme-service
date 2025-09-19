import { config } from '@notifications/config';
import { IEmailLocals, winstonLogger } from '@nucknine/fixme-shared';
import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from '@notifications/queues/connection';
import { sendEmail } from '@notifications/queues/mail.transport';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'emailConsumer', 'debug');

async function consumeAuthEmailMessages(channel: Channel | undefined): Promise<void> {
  try {
    if (!channel) {
      channel = await createConnection();
      return;
    }

    if (!channel) {
      log.log('error', 'NotificationService EmailConsumer consumeAuthEmailMessages() method error:', "Can't create a channel");
    }
    /*
    Any time you publish a message to the to this exchange
    email notification using this routing key it's always going to send
    that message to this queue.
    And then every consumer attached to this queue will get that message.
    */
    const exchangeName = 'fixme-email-notification';
    const routingKey = 'auth-email';
    const queueName = 'auth-email-queue';
    /*
    assertQueue — проверяет, существует ли очередь с заданным именем, и создаёт её,
    если не существует.
    Это гарантирует, что очередь готова к использованию.
    assertExchange — аналогично, проверяет наличие обменника (exchange) и создаёт его
    при необходимости. Это нужно для маршрутизации сообщений.
    */
    await channel.assertExchange(exchangeName, 'direct');
    const fixmeQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    // связывает очередь с обменником (exchange) через указанный ключ маршрутизации (routing key)
    // bindQueue говорит RabbitMQ:
    // «Сообщения, отправленные в этот exchange с таким ключом, должны попадать в эту очередь».
    // Это необходимо для правильной маршрутизации сообщений в системе
    await channel.bindQueue(fixmeQueue.queue, exchangeName, routingKey);
    // начинает прослушивание очереди и обработку входящих сообщений
    // регистрирует обработчик (callback), который будет вызываться каждый раз, когда в очередь поступает новое сообщение
    channel.consume(fixmeQueue.queue, async (msg: ConsumeMessage | null) => {
      const { receiverEmail, username, verifyLink, resetLink, template, otp } = JSON.parse(msg!.content.toString());
      const locals: IEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
        username,
        verifyLink,
        resetLink,
        // otp
      };
      await sendEmail(template, receiverEmail, locals);
      channel?.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'NotificationService EmailConsumer consumeAuthEmailMessages() method error:', error);
  }
}

async function consumeOrderEmailMessages(channel: Channel | undefined): Promise<void> {
  try {
    if (!channel) {
      channel = await createConnection() ;
    }
    if (!channel) {
      log.log('error', 'NotificationService EmailConsumer consumeOrderEmailMessages() method error:', "Can't create a channel");
      return;
    }
    const exchangeName = 'fixme-order-notification';
    const routingKey = 'order-email';
    const queueName = 'order-email-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const fixmeQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(fixmeQueue.queue, exchangeName, routingKey);
    channel.consume(fixmeQueue.queue, async (msg: ConsumeMessage | null) => {
      const {
        receiverEmail,
        username,
        template,
        sender,
        offerLink,
        amount,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        subject,
        header,
        type,
        message,
        serviceFee,
        total
      } = JSON.parse(msg!.content.toString());
      const locals: IEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
        username,
        sender,
        offerLink,
        amount,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        subject,
        header,
        type,
        message,
        serviceFee,
        total
      };
      if (template === 'orderPlaced') {
        await sendEmail('orderPlaced', receiverEmail, locals);
        await sendEmail('orderReceipt', receiverEmail, locals);
      } else {
        await sendEmail(template, receiverEmail, locals);
      }
      channel?.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'NotificationService EmailConsumer consumeOrderEmailMessages() method error:', error);
  }
}

export { consumeAuthEmailMessages, consumeOrderEmailMessages };
