import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

// DTOs define the shape of data that will be sent to/from our API
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Required product name

  @IsString()
  @IsNotEmpty()
  description: string; // Required product description

  @IsNumber()
  @Min(0)
  price: number; // Required product price

  @IsString()
  @IsNotEmpty()
  sku: string; // Required stock keeping unit

  @IsNumber()
  @Min(0)
  stock: number; // Required inventory count
}
