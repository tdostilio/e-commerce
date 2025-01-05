// DTOs define the shape of data that will be sent to/from our API
export class CreateProductDto {
  name: string; // Required product name
  description: string; // Required product description
  price: number; // Required product price
  sku: string; // Required stock keeping unit
  stock: number; // Required inventory count
}
