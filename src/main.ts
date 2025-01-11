import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { rabbitmqConfig } from './config/rabbitmq.config';
import { RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Create a logger instance for startup logs
  const logger = new Logger('Bootstrap');

  try {
    // Create the NestJS application instance
    const app = await NestFactory.create(AppModule);

    // Set default port with fallback to 3000
    const port = parseInt(process.env.PORT || '3000', 10);

    // Enable validation pipes globally
    app.useGlobalPipes(new ValidationPipe());

    // Initialize Swagger documentation
    setupSwagger(app);

    // Connect to RabbitMQ
    const rmqConfig = rabbitmqConfig();
    logger.debug(
      `Connecting to RabbitMQ with config: ${JSON.stringify(rmqConfig)}`,
    );

    const microservice = app.connectMicroservice<RmqOptions>(rmqConfig);
    await microservice.listen();

    logger.log(
      `🐰 RabbitMQ consumer connected and listening on queue: product_queue`,
    );

    // Start both HTTP and microservice servers
    await app.startAllMicroservices();
    await app.listen(port);

    // Log successful startup
    logger.log(`🚀 HTTP Server running on port ${port}`);
    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api`,
    );
    logger.log(`🐰 RabbitMQ consumer connected to ${process.env.RABBITMQ_URL}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    if (error.message.includes('ECONNREFUSED')) {
      logger.error('❌ Failed to connect to RabbitMQ. Is it running?');
    }
    process.exit(1);
  }
}

bootstrap();
