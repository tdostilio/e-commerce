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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

// @Controller('products') creates routes starting with /products
@ApiTags('products')
@Controller('products')
export class ProductsController {
  // ProductsService is automatically injected
  constructor(private readonly productsService: ProductsService) {}

  // @Get() creates a GET /products endpoint
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // @Get(':id') creates a GET /products/:id endpoint
  // @Param('id') extracts the id from the URL
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return the product.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
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
      if (error.code === 'P2002') {
        throw new BadRequestException('SKU must be unique');
      }
      throw error;
    }
  }

  // @Put(':id') creates a PUT /products/:id endpoint
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // @Delete(':id') creates a DELETE /products/:id endpoint
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
