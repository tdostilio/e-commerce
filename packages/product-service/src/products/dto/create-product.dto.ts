import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Test Product', // Example value
    description: 'The name of the product', // Description of the property
  })
  @IsString() // Validation decorator
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'A detailed description',
    description: 'Product description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 29.99, description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'TEST-001', description: 'Product SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 100, description: 'Available stock' })
  @IsNumber()
  @Min(0)
  stock: number;
}
