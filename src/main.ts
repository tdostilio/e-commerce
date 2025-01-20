import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { rabbitmqConfig } from './config/rabbitmq.config';
import { RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Create a logger for startup process
  const logger = new Logger('Bootstrap');

  try {
    // Create the main NestJS application
    const app = await NestFactory.create(AppModule);

    // Configure port with fallback
    const port = parseInt(process.env.PORT || '3000', 10);

    // Enable automatic validation using class-validator
    app.useGlobalPipes(new ValidationPipe());

    // Set up Swagger API documentation
    setupSwagger(app);

    // Start HTTP server first
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 HTTP Server running on port ${port}`);
    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api`,
    );

    // Then connect to RabbitMQ
    try {
      const rmqConfig = rabbitmqConfig();
      logger.debug(
        `Connecting to RabbitMQ with config: ${JSON.stringify(rmqConfig)}`,
      );

      const microservice = app.connectMicroservice<RmqOptions>(rmqConfig);
      await microservice.listen();
      await app.startAllMicroservices();

      logger.log(
        `🐰 RabbitMQ consumer connected to ${process.env.RABBITMQ_URL}`,
      );
    } catch (rmqError) {
      logger.error('Failed to connect to RabbitMQ:', rmqError);
      logger.warn('Application continuing without RabbitMQ connection');
    }
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
