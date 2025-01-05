# Product Service

A NestJS microservice for managing products in our e-commerce platform.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Yarn

## Getting Started

1. **Clone the repository**
   bash
   git clone <repository-url>
   cd e-commerce/packages/product-service
   bash

2. **Set up environment variables**
   Copy the example env file
   bash
   cp .env.example .env
   bash
   The .env file should contain:
   DATABASE_URL="mongodb://localhost:27017/products?replicaSet=rs0&directConnection=true"

3. **Start MongoDB with Docker**
   bash
   docker compose up -d
   bash

4. **Run the application**
   bash
   yarn start
   bash

5. **Install dependencies**
   bash
   yarn install
   bash

6. **Generate Prisma client**
   bash
   yarn prisma generate
   bash

7. **Start the development server**
   bash
   yarn start:dev
   bash

## API Endpoints

The service runs on `http://localhost:3000` with the following endpoints:

- `POST /api/products` - Create a product
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get a single product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## Example Request

Create a product
bash
curl -X POST http://localhost:3000/api/products \
-H "Content-Type: application/json" \
-d '{
"name": "Test Product",
"description": "A test product",
"price": 29.99,
"sku": "TEST-001",
"stock": 100
}'
bash

## Development

- `yarn start:dev` - Start with hot-reload
- `yarn start:debug` - Start with debugging
- `yarn test` - Run tests
- `yarn lint` - Run linting

## Troubleshooting

1. **MongoDB Connection Issues**

   - Ensure Docker is running
   - Try restarting the containers: `docker-compose down -v && docker-compose up -d`
   - Check MongoDB logs: `docker-compose logs mongodb`

2. **Prisma Issues**
   - Regenerate Prisma client: `yarn prisma:generate`
   - Reset database: `yarn prisma:reset`

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
