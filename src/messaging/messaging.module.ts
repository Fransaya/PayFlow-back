import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WhatsAppServide } from './services/whatsapp.service';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ||
              'amqp://rabbitmq:rabbitmq123@rabbitmq:5672/multistore',
          ],
          queue: 'carrito_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  providers: [WhatsAppServide],
  exports: [ClientsModule, WhatsAppServide],
})
export class MessagingModule {}
