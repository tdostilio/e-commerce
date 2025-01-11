import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [InventoryController],
})
export class InventoryModule {}
