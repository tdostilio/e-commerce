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
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(
        `Processing inventory check request: ${JSON.stringify(data)}`,
      );

      const result = await this.productsService.checkAvailability(
        data.sku,
        data.quantity,
      );

      // Acknowledge successful processing
      channel.ack(originalMsg);

      return {
        skuExists: true,
        hasAvailableStock: result.hasAvailableStock,
        availableQuantity: result.availableQuantity,
      };
    } catch (error) {
      this.logger.error('Failed to process inventory check:', error);

      // Reject the message and send to DLQ if it's been retried too many times
      const retryCount = this.getRetryCount(originalMsg);
      if (retryCount >= 3) {
        channel.reject(originalMsg, false); // Don't requeue, send to DLQ
        this.logger.warn(
          `Message rejected and sent to DLQ after ${retryCount} retries`,
        );
      } else {
        // Reject and requeue for retry
        channel.reject(originalMsg, true);
        this.logger.warn(
          `Message requeued for retry (attempt ${retryCount + 1})`,
        );
      }
      throw error;
    }
  }

  private getRetryCount(msg: any): number {
    const headers = msg.properties.headers || {};
    return headers['x-retry-count'] || 0;
  }

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
