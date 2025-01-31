import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  DuplicateSkuError,
  ProductNotFoundError,
} from './errors/product.errors';

export interface StockCheckResponse {
  skuExists: boolean;
  hasAvailableStock: boolean;
  availableQuantity: number;
}

// @Injectable() marks this as a service that can be injected into other classes
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  // Prisma is automatically injected by NestJS's dependency injection
  constructor(private prisma: PrismaService) {}

  // Get all products from the database
  async findAll() {
    return this.prisma.product.findMany();
  }

  // Get a single product by ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ProductNotFoundError(id);
    }

    return product;
  }

  // Create a new product
  async create(data: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data, // Prisma will validate this matches our schema
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new DuplicateSkuError();
      }
      throw error;
    }
  }

  // Update an existing product
  // Partial<CreateProductDto> means all fields are optional
  async update(id: string, data: Partial<CreateProductDto>) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ProductNotFoundError(id);
      }
      throw error;
    }
  }

  // Delete a product
  async remove(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ProductNotFoundError(id);
      }
      throw error;
    }
  }

  // async checkAvailability(
  //   sku: string,
  //   quantity: number,
  // ): Promise<StockCheckResponse> {
  //   const product = await this.prisma.product.findUnique({
  //     where: { sku },
  //     select: { stock: true, reserved: true },
  //   });

  //   if (!product) {
  //     return {
  //       skuExists: false,
  //       hasAvailableStock: false,
  //       availableQuantity: 0,
  //     };
  //   }

  //   const availableQuantity = product.stock - product.reserved;
  //   return {
  //     skuExists: true,
  //     hasAvailableStock: availableQuantity >= quantity,
  //     availableQuantity,
  //   };
  // }

  async reserveStock(
    orderId: string,
    sku: string,
    quantity: number,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { sku },
        select: { stock: true },
      });

      if (!product) {
        throw new NotFoundException(`SKU ${sku} not found`);
      }

      const availableQuantity = await this.getAvailableStock(sku);
      if (availableQuantity < quantity) {
        throw new Error(
          `Insufficient stock for SKU ${sku}. Requested: ${quantity}, Available: ${availableQuantity}`,
        );
      }

      await tx.stockReservation.create({
        data: {
          orderId,
          sku,
          quantity,
          status: 'RESERVED',
        },
      });

      this.logger.log(
        `Reserved ${quantity} units of ${sku} for order ${orderId}`,
      );
    });
  }

  async getAvailableStock(sku: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
    });

    const reservedQuantity = await this.prisma.stockReservation.aggregate({
      where: {
        sku,
        status: 'RESERVED', // Only count active reservations
      },
      _sum: {
        quantity: true,
      },
    });

    return product.stock - (reservedQuantity._sum.quantity || 0);
  }
}
