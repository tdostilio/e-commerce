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

    // Then connect to RabbitMQ with retry logic
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        const rmqConfig = rabbitmqConfig();
        const microservice = app.connectMicroservice<RmqOptions>(rmqConfig);
        await microservice.listen();

        logger.log(
          `🐰 RabbitMQ consumer connected to ${process.env.RABBITMQ_URL}`,
        );
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        logger.error(
          `Failed to connect to RabbitMQ (attempt ${retryCount}/${maxRetries})`,
        );

        if (retryCount === maxRetries) {
          logger.error(
            'Max retries reached, application will continue without RabbitMQ',
          );
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        logger.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
