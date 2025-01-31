import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { ProductsService } from '../products/products.service';

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('order.created')
  async handleOrderCreated(
    @Payload()
    data: {
      orderId: string;
      sku: string;
      quantity: number;
    },
  ) {
    this.logger.debug('Received order created event');
    this.logger.debug(`Payload: ${JSON.stringify(data)}`);

    try {
      await this.productsService.reserveStock(
        data.orderId,
        data.sku,
        data.quantity,
      );
      this.logger.debug('Successfully processed order created event');
    } catch (error) {
      this.logger.error('Failed to process order created event:', error);
      throw error;
    }
  }
}
