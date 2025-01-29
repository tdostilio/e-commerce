import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Ctx, RmqContext } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  DuplicateSkuError,
  ProductNotFoundError,
} from './errors/product.errors';
import { MessagePattern, Payload } from '@nestjs/microservices';

// @Controller('products') creates routes starting with /products
@ApiTags('products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  // ProductsService is automatically injected
  constructor(private readonly productsService: ProductsService) {}

  // @Get() creates a GET /products endpoint
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAll() {
    return this.productsService.findAll();
  }

  // @Get(':id') creates a GET /products/:id endpoint
  // @Param('id') extracts the id from the URL
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return the product.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsService.findOne(id);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  // @Post() creates a POST /products endpoint
  // @Body() extracts the request body and validates it against CreateProductDto
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productsService.create(createProductDto);
    } catch (error) {
      if (error instanceof DuplicateSkuError) {
        throw new BadRequestException('A product with this SKU already exists');
      }
      throw error;
    }
  }

  // @Put(':id') creates a PUT /products/:id endpoint
  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiBody({ type: CreateProductDto })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateProductDto>,
  ) {
    try {
      // create some whitelist of fields that can be updated
      const allowedFields = ['name', 'description', 'price', 'stock'];
      const updatedData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) =>
          allowedFields.includes(key),
        ),
      );
      return await this.productsService.update(id, updatedData);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  // @Delete(':id') creates a DELETE /products/:id endpoint
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.productsService.remove(id);
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  @MessagePattern('product.check_availability')
  async checkAvailability(
    @Payload() data: { sku: string; quantity: number },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    this.logger.debug('Received RPC call for product availability check');
    this.logger.debug(`Payload: ${JSON.stringify(data)}`);

    try {
      const result = await this.productsService.getAvailableStock(data.sku);

      // Acknowledge the message
      channel.ack(message);

      this.logger.debug(`Sending RPC response: ${JSON.stringify(result)}`);
      // Return the result - NestJS will handle sending it back through RabbitMQ
      return result;
    } catch (error) {
      this.logger.error('Failed to process RPC call:', error);
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
  ) {
    this.logger.debug('Received order created event:', data);
    try {
      await this.productsService.reserveStock(
        data.orderId,
        data.sku,
        data.quantity,
      );
      this.logger.debug('Successfully processed order created event');
    } catch (error) {
      this.logger.error('Error processing order created event:', error);
      throw error;
    }
  }
}
