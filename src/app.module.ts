import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';

// Root module that ties everything together
@Module({
  imports: [
    PrismaModule, // Database connection
    ProductsModule, // Products feature
    InventoryModule, // Add the inventory module
  ],
})
export class AppModule {}
