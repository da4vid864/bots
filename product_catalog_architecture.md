# Intelligent Product Catalog Module - Architecture & Implementation Plan

## 1. Database Schema (`services/initDb.js`)

We need a new table to store product information associated with each bot.

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    bot_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'MXN',
    image_url TEXT,
    tags TEXT[],
    stock_status TEXT DEFAULT 'in_stock', -- 'in_stock', 'out_of_stock', 'pre_order'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bot_id, sku),
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
);
```

## 2. Backend Architecture

### A. Product Service (`services/productService.js`)
Create a new service file to handle CRUD operations.

*   **`createProduct(botId, productData)`**: Insert new product.
*   **`getProductsByBot(botId)`**: Fetch all products for a specific bot.
*   **`getProductBySku(botId, sku)`**: Fetch a single product by SKU (used for bot responses).
*   **`updateProduct(id, productData)`**: Update product details.
*   **`deleteProduct(id)`**: Remove a product.

### B. API Routes (`server.js`)
Add RESTful endpoints for the frontend to manage products.

*   `GET /api/products/:botId` -> `productService.getProductsByBot`
*   `POST /api/products/:botId` -> `productService.createProduct`
*   `PUT /api/products/:id` -> `productService.updateProduct`
*   `DELETE /api/products/:id` -> `productService.deleteProduct`

*Note: Ensure these routes are protected with `requireAuth` or `requireAdmin`.*

## 3. AI Integration Logic (`services/baileysManager.js`)

### A. Context Injection
Modify `handleIncomingMessage` to inject product data into the system prompt before calling the AI.

1.  **Fetch Products**: Before generating the AI response, call `productService.getProductsByBot(botId)`.
2.  **Format Context**: Create a string representation of the catalog.
    ```javascript
    const productContext = products.map(p => 
        `- [${p.sku}] ${p.name} (${p.price} ${p.currency}): ${p.description} (${p.stock_status})`
    ).join('\n');
    ```
3.  **Append to Prompt**: Add this context to `promptWithImages` (or a new variable `finalPrompt`).
    *   *Instruction*: "Tienes acceso al siguiente catálogo de productos: [productContext]. Si el usuario pregunta por precios o detalles, usa esta información. Si crees que el usuario quiere ver el producto visualmente, responde con `$$ SEND_PRODUCT: SKU $$` al final."

### B. Response Handling (Regex)
Modify the response processing logic to catch the product trigger.

1.  **Regex**: `/\$\$\s*SEND_PRODUCT:\s*([\w-]+)\s*\$\$/i`
2.  **Logic**:
    *   If match found, extract `SKU`.
    *   Call `productService.getProductBySku(botId, sku)`.
    *   **If Image Exists**: Send image using `sendImage` with a caption containing Name, Price, and Description.
    *   **If No Image**: Send a formatted text message with the details.
    *   Remove the tag from the text response sent to the user.

## 4. Frontend Architecture

### A. Product Manager Component (`client/src/components/ProductManager.jsx`)
A new component to manage the catalog.

*   **Props**: `botId`
*   **State**: `products` (list), `isModalOpen`, `editingProduct`.
*   **UI**:
    *   **List View**: Table showing SKU, Name, Price, Stock Status. Actions: Edit, Delete.
    *   **Add/Edit Modal**: Form with fields for SKU, Name, Description, Price, Currency, Image URL, Tags.

### B. Integration (`client/src/pages/Dashboard.jsx`)
*   Add a "Manage Products" button or section within the `BotCard` or as a new tab in the Dashboard if it gets too complex.
*   For now, adding it inside the `details` section of `BotCard` (similar to Scoring Rules) is a good starting point.

## 5. Implementation Steps for Code Mode

1.  **Database**: Update `services/initDb.js` and run the migration.
2.  **Backend Service**: Create `services/productService.js`.
3.  **API Routes**: Update `server.js` with product routes.
4.  **Frontend Component**: Create `client/src/components/ProductManager.jsx`.
5.  **Frontend Integration**: Update `client/src/pages/Dashboard.jsx` (or `BotCard.jsx`) to include `ProductManager`.
6.  **AI Logic**: Update `services/baileysManager.js` to inject context and handle `SEND_PRODUCT` tag.