import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

// @Controller('products') creates routes starting with /products
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
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // @Post() creates a POST /products endpoint
  // @Body() extracts the request body and validates it against CreateProductDto
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
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
