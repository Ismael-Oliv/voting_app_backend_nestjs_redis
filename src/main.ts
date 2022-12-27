import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocketIOAdpter } from './socket-io-adpter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Main (main.ts)');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const clientPort = parseInt(configService.get('CLIENT_PORT'));
  const port = parseInt(configService.get('PORT'));

  app.enableCors({
    origin: [
      `http://localhost:${clientPort}`,
      new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
    ],
  });

  app.useWebSocketAdapter(new SocketIOAdpter(app, configService));

  const config = new DocumentBuilder()
    .setTitle('Voting')
    .setDescription('The voting API description')
    .setVersion('1.0')

    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);

  logger.log(`Server running on port ${port}`);
}
bootstrap();
