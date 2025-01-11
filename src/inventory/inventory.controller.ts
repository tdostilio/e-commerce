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

  @MessagePattern('inventory.check_availability')
  async checkAvailability(
    @Payload() data: { sku: string; quantity: number },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    this.logger.debug('Received inventory check request');
    this.logger.debug(`Payload: ${JSON.stringify(data)}`);

    try {
      const result = await this.productsService.checkAvailability(
        data.sku,
        data.quantity,
      );

      const response = {
        skuExists: true,
        hasAvailableStock: result.hasAvailableStock,
        availableQuantity: result.availableQuantity,
      };

      this.logger.debug(`Sending response: ${JSON.stringify(response)}`);
      channel.ack(message);
      return response;
    } catch (error) {
      this.logger.error('Failed to process request:', error);
      channel.nack(message, false, true);
      throw error;
    }
  }

  @MessagePattern('order.created')
  async handleOrderCreated(
    @Payload()
    data: {
      orderId: string;
      sku: string;
      quantity: number;
    },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    this.logger.debug('Received order created event');
    this.logger.debug(`Payload: ${JSON.stringify(data)}`);

    try {
      await this.productsService.reserveStock(
        data.orderId,
        data.sku,
        data.quantity,
      );
      this.logger.debug('Successfully processed order created event');
      channel.ack(message);
    } catch (error) {
      this.logger.error('Failed to process order created event:', error);
      channel.nack(message, false, true);
      throw error;
    }
  }
}
