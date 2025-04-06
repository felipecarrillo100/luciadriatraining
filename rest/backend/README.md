# Express File Storage API

This is a simple Node.js application using Express to create a RESTful API for managing items stored in a JSON file. The API allows you to perform CRUD (Create, Read, Update, Delete) operations on items.

## Features

- Add new items with a unique ID.
- Retrieve all items.
- Update an item by its ID.
- Delete an item by its ID.
- Delete all items.

## Prerequisites

- Node.js (version 12 or higher)
- npm (Node Package Manager)

## Installation

1. Install the dependencies.

   ```bash
   npm install
   ```

## Usage

1. Start the server.

```bash
npm start
```

2. The server will run on `http://localhost:3000` (you can edit this in index.js)

## API Endpoints

- **GET /api/items**: Retrieve all stored items.
- **POST /api/items**: Add a new item. Send a JSON object in the request body.
- **PUT /api/items/:id**: Update an existing item by `id`. Send the updated fields in the request body.
- **DELETE /api/items/:id**: Delete an item by `id`.
- **DELETE /api/items**: Delete all items.

## Example Requests

- **Add a new item**:

  ```bash
  curl -X POST http://localhost:3000/api/items -H "Content-Type: application/json" -d '{"name": "Item 1", "value": 100}'
  ```

- **Get all items**:

  ```bash
  curl http://localhost:3000/api/items
  ```

- **Update an item**:

  ```bash
  curl -X PUT http://localhost:3000/api/items/123456789 -H "Content-Type: application/json" -d '{"name": "Updated Item", "value": 200}'
  ```

- **Delete an item**:

  ```bash
  curl -X DELETE http://localhost:3000/api/items/123456789
  ```

- **Delete all items**:

  ```bash
  curl -X DELETE http://localhost:3000/api/items
  ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
