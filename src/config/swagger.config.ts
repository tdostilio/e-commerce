import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Product Service API')
    .setDescription('E-commerce product and inventory management service')
    .setVersion('1.0')
    .addTag('products')
    .addTag('inventory')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
