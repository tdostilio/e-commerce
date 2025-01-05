import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

// @Injectable() marks this as a service that can be injected into other classes
@Injectable()
export class ProductsService {
  // Prisma is automatically injected by NestJS's dependency injection
  constructor(private prisma: PrismaService) {}

  // Get all products from the database
  async findAll() {
    return this.prisma.product.findMany();
  }

  // Get a single product by ID
  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  // Create a new product
  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data, // Prisma will validate this matches our schema
    });
  }

  // Update an existing product
  // Partial<CreateProductDto> means all fields are optional
  async update(id: string, data: Partial<CreateProductDto>) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Delete a product
  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
