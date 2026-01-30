# Admin Panel Products & Categories API Integration Guide

This document provides API documentation for frontend developers integrating product and category management into the admin panel.

---

## Table of Contents

1. [Overview](#overview)
2. [Category Management APIs](#category-management-apis)
3. [Product Management APIs](#product-management-apis)
4. [Product Variants APIs](#product-variants-apis)
5. [File Upload APIs](#file-upload-apis)
6. [Error Handling](#error-handling)
7. [Quick Reference](#quick-reference)

---

## Overview

The admin panel provides full CRUD operations for managing products and categories. All endpoints require authentication and admin/super_admin role.

### Required Headers

All requests must include:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <access_token>` | JWT access token |
| `Content-Type` | `application/json` | For requests with body |

### Required Role

All endpoints require one of the following roles:
- `admin`
- `super_admin`

### Product Status Values

| Status | Description |
|--------|-------------|
| `draft` | Product is not published |
| `active` | Product is live and visible |
| `inactive` | Product is temporarily hidden |
| `out_of_stock` | Product has no stock |

---

## Category Management APIs

Categories support hierarchical structure (parent/child relationships).

### List Categories (Paginated)

```http
GET /admin/categories
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | sortOrder | Sort field: `sortOrder`, `name`, `createdAt`, `updatedAt` |
| `sortOrder` | string | DESC | `ASC` or `DESC` |
| `search` | string | - | Search in name, slug, description |
| `isActive` | boolean | - | Filter by active status |
| `parentId` | UUID | - | Filter by parent category |
| `rootOnly` | boolean | - | Show only root categories (no parent) |
| `includeDeleted` | boolean | - | Include soft-deleted categories |
| `onlyDeleted` | boolean | - | Show only soft-deleted categories |

**Example Request:**

```
GET /admin/categories?page=1&limit=20&rootOnly=true&isActive=true
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "لباس مردانه",
        "slug": "mens-clothing",
        "description": "انواع لباس مردانه با کیفیت عالی",
        "image": "https://example.com/category.jpg",
        "parentId": null,
        "parent": null,
        "children": [],
        "isActive": true,
        "sortOrder": 1,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "deletedAt": null
      }
    ],
    "meta": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### Get Category Tree

Returns hierarchical category structure with children.

```http
GET /admin/categories/tree
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Category tree retrieved successfully",
  "data": [
    {
      "id": "uuid-1",
      "name": "لباس",
      "slug": "clothing",
      "isActive": true,
      "sortOrder": 1,
      "children": [
        {
          "id": "uuid-2",
          "name": "لباس مردانه",
          "slug": "mens-clothing",
          "parentId": "uuid-1",
          "isActive": true,
          "sortOrder": 1,
          "children": [
            {
              "id": "uuid-3",
              "name": "پیراهن مردانه",
              "slug": "mens-shirts",
              "parentId": "uuid-2",
              "isActive": true,
              "sortOrder": 1,
              "children": []
            }
          ]
        },
        {
          "id": "uuid-4",
          "name": "لباس زنانه",
          "slug": "womens-clothing",
          "parentId": "uuid-1",
          "isActive": true,
          "sortOrder": 2,
          "children": []
        }
      ]
    }
  ]
}
```

---

### Get Simple Categories List (For Dropdowns)

```http
GET /admin/categories/simple
Authorization: Bearer <access_token>
```

Returns a lightweight list suitable for dropdown/select menus.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    { "id": "uuid-1", "name": "لباس", "slug": "clothing", "parentId": null },
    { "id": "uuid-2", "name": "لباس مردانه", "slug": "mens-clothing", "parentId": "uuid-1" },
    { "id": "uuid-3", "name": "کفش", "slug": "shoes", "parentId": null }
  ]
}
```

---

### Get Category Statistics

```http
GET /admin/categories/stats
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalCategories": 25
  }
}
```

---

### Get Single Category

```http
GET /admin/categories/:id
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Category ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "لباس مردانه",
    "slug": "mens-clothing",
    "description": "انواع لباس مردانه با کیفیت عالی",
    "image": "https://example.com/category.jpg",
    "parentId": "parent-uuid",
    "parent": {
      "id": "parent-uuid",
      "name": "لباس",
      "slug": "clothing"
    },
    "children": [
      {
        "id": "child-uuid",
        "name": "پیراهن مردانه",
        "slug": "mens-shirts"
      }
    ],
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Category not found"
}
```

---

### Create Category

```http
POST /admin/categories
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 2-255 characters (Persian supported) |
| `slug` | string | Yes | 2-255 characters, unique, URL-friendly |
| `description` | string | No | Text description (Persian supported) |
| `image` | string | No | Valid URL |
| `parentId` | UUID | No | Valid category UUID for nested categories |
| `isActive` | boolean | No | Default: `true` |
| `sortOrder` | number | No | Default: `0`, minimum: `0` |

**Example Request:**

```json
{
  "name": "لباس مردانه",
  "slug": "mens-clothing",
  "description": "انواع لباس مردانه با کیفیت عالی",
  "image": "https://example.com/category.jpg",
  "parentId": "550e8400-e29b-41d4-a716-446655440001",
  "isActive": true,
  "sortOrder": 1
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "new-category-uuid",
    "name": "لباس مردانه",
    "slug": "mens-clothing",
    "description": "انواع لباس مردانه با کیفیت عالی",
    "image": "https://example.com/category.jpg",
    "parentId": "550e8400-e29b-41d4-a716-446655440001",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (409 - Duplicate Slug):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Category with this slug already exists"
}
```

**Error Response (400 - Invalid Parent):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Parent category not found"
}
```

---

### Update Category

```http
PATCH /admin/categories/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Category ID |

**Request Body (all fields optional):**

```json
{
  "name": "لباس مردانه - ویرایش شده",
  "slug": "mens-clothing-updated",
  "description": "توضیحات جدید",
  "image": "https://example.com/new-image.jpg",
  "parentId": "new-parent-uuid",
  "isActive": false,
  "sortOrder": 2
}
```

> **Important:**
> - Cannot set a category as its own parent
> - Cannot set a child category as parent (circular reference prevention)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "category-uuid",
    "name": "لباس مردانه - ویرایش شده",
    "...": "..."
  }
}
```

**Error Response (400 - Circular Reference):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot set a child category as parent (circular reference)"
}
```

---

### Delete Category (Soft Delete)

```http
DELETE /admin/categories/:id
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null
}
```

---

### Restore Deleted Category

```http
PATCH /admin/categories/:id/restore
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Category restored successfully",
  "data": {
    "id": "category-uuid",
    "name": "لباس مردانه",
    "...": "..."
  }
}
```

**Error Response (400 - Not Deleted):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Category is not deleted"
}
```

---

## Product Management APIs

### List Products (Paginated)

```http
GET /admin/products
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | createdAt | Sort field: `name`, `price`, `quantity`, `sku`, `createdAt`, `updatedAt` |
| `sortOrder` | string | DESC | `ASC` or `DESC` |
| `search` | string | - | Search in name, slug, SKU, description |
| `status` | string | - | Filter: `draft`, `active`, `inactive`, `out_of_stock` |
| `categoryId` | UUID | - | Filter by category |
| `minPrice` | number | - | Minimum price filter |
| `maxPrice` | number | - | Maximum price filter |
| `hasVariants` | boolean | - | Filter products with/without variants |
| `inStock` | boolean | - | Filter in-stock products only |
| `lowStock` | boolean | - | Filter low-stock products |
| `createdAfter` | string | - | ISO date (e.g., `2024-01-15`) |
| `createdBefore` | string | - | ISO date |
| `includeDeleted` | boolean | - | Include soft-deleted products |
| `onlyDeleted` | boolean | - | Show only soft-deleted products |

**Example Request:**

```
GET /admin/products?page=1&limit=20&status=active&categoryId=uuid&minPrice=100000&sortBy=price&sortOrder=ASC
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "کفش ورزشی نایکی",
        "slug": "nike-sport-shoes",
        "description": "کفش ورزشی نایکی با کیفیت عالی و راحت",
        "shortDescription": "کفش ورزشی نایکی",
        "sku": "NIKE-001",
        "price": 1500000,
        "compareAtPrice": 2000000,
        "costPrice": 1000000,
        "quantity": 100,
        "lowStockThreshold": 5,
        "weight": 500.5,
        "status": "active",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "categoryId": "category-uuid",
        "category": {
          "id": "category-uuid",
          "name": "کفش ورزشی",
          "slug": "sport-shoes"
        },
        "hasVariants": true,
        "variants": [
          {
            "id": "variant-uuid-1",
            "name": "قرمز - سایز 42",
            "sku": "NIKE-001-RED-42",
            "price": 1500000,
            "quantity": 25,
            "attributes": { "color": "قرمز", "size": "42" },
            "isActive": true
          }
        ],
        "isInStock": true,
        "isLowStock": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "deletedAt": null
      }
    ],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### Get Product Statistics

```http
GET /admin/products/stats
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalProducts": 500,
    "activeProducts": 350,
    "draftProducts": 100,
    "outOfStockProducts": 30,
    "lowStockProducts": 20
  }
}
```

---

### Get Single Product

```http
GET /admin/products/:id
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "کفش ورزشی نایکی",
    "slug": "nike-sport-shoes",
    "description": "کفش ورزشی نایکی با کیفیت عالی و راحت برای ورزش و پیاده‌روی",
    "shortDescription": "کفش ورزشی نایکی",
    "sku": "NIKE-001",
    "price": 1500000,
    "compareAtPrice": 2000000,
    "costPrice": 1000000,
    "quantity": 100,
    "lowStockThreshold": 5,
    "weight": 500.5,
    "status": "active",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "categoryId": "category-uuid",
    "category": {
      "id": "category-uuid",
      "name": "کفش ورزشی",
      "slug": "sport-shoes"
    },
    "hasVariants": true,
    "variants": [
      {
        "id": "variant-uuid-1",
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "قرمز - سایز 42",
        "sku": "NIKE-001-RED-42",
        "price": 1500000,
        "quantity": 25,
        "attributes": { "color": "قرمز", "size": "42" },
        "image": "https://example.com/red-42.jpg",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "variant-uuid-2",
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "آبی - سایز 43",
        "sku": "NIKE-001-BLUE-43",
        "price": 1550000,
        "quantity": 30,
        "attributes": { "color": "آبی", "size": "43" },
        "image": null,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "metadata": {
      "brand": "Nike",
      "material": "چرم مصنوعی"
    },
    "isInStock": true,
    "isLowStock": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found"
}
```

---

### Create Product

```http
POST /admin/products
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 2-255 characters (Persian supported) |
| `slug` | string | Yes | 2-255 characters, unique, URL-friendly |
| `description` | string | No | Text description (Persian supported) |
| `shortDescription` | string | No | Max 500 characters |
| `sku` | string | Yes | 1-100 characters, unique |
| `price` | number | Yes | Minimum: 0 (in Toman) |
| `compareAtPrice` | number | No | Original price for discount display |
| `costPrice` | number | No | Cost price for profit calculation |
| `quantity` | number | No | Default: 0, minimum: 0 |
| `lowStockThreshold` | number | No | Default: 5, minimum: 0 |
| `weight` | number | No | Weight in grams |
| `status` | string | No | `draft`, `active`, `inactive`, `out_of_stock`. Default: `draft` |
| `images` | string[] | No | Array of image URLs |
| `categoryId` | UUID | No | Valid category UUID |
| `hasVariants` | boolean | No | Default: `false` |
| `variants` | array | No | Array of variant objects |
| `metadata` | object | No | Additional data as JSON |

**Variant Object Structure:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-255 characters |
| `sku` | string | Yes | 1-100 characters, unique |
| `price` | number | Yes | Minimum: 0 |
| `quantity` | number | No | Default: 0 |
| `attributes` | object | No | Key-value pairs (e.g., `{ "color": "قرمز", "size": "L" }`) |
| `image` | string | No | Image URL |
| `isActive` | boolean | No | Default: `true` |

**Example Request (Without Variants):**

```json
{
  "name": "کفش ورزشی نایکی",
  "slug": "nike-sport-shoes",
  "description": "کفش ورزشی نایکی با کیفیت عالی و راحت",
  "shortDescription": "کفش ورزشی نایکی",
  "sku": "NIKE-001",
  "price": 1500000,
  "compareAtPrice": 2000000,
  "costPrice": 1000000,
  "quantity": 100,
  "lowStockThreshold": 5,
  "weight": 500.5,
  "status": "active",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "categoryId": "550e8400-e29b-41d4-a716-446655440001",
  "metadata": {
    "brand": "Nike",
    "material": "چرم مصنوعی"
  }
}
```

**Example Request (With Variants):**

```json
{
  "name": "تی‌شرت مردانه",
  "slug": "mens-tshirt",
  "description": "تی‌شرت مردانه با کیفیت عالی",
  "sku": "TSHIRT-001",
  "price": 350000,
  "status": "active",
  "images": ["https://example.com/tshirt.jpg"],
  "categoryId": "category-uuid",
  "hasVariants": true,
  "variants": [
    {
      "name": "قرمز - سایز M",
      "sku": "TSHIRT-001-RED-M",
      "price": 350000,
      "quantity": 20,
      "attributes": { "color": "قرمز", "size": "M" },
      "isActive": true
    },
    {
      "name": "قرمز - سایز L",
      "sku": "TSHIRT-001-RED-L",
      "price": 350000,
      "quantity": 15,
      "attributes": { "color": "قرمز", "size": "L" },
      "isActive": true
    },
    {
      "name": "آبی - سایز M",
      "sku": "TSHIRT-001-BLUE-M",
      "price": 360000,
      "quantity": 25,
      "attributes": { "color": "آبی", "size": "M" },
      "image": "https://example.com/tshirt-blue.jpg",
      "isActive": true
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "new-product-uuid",
    "name": "کفش ورزشی نایکی",
    "slug": "nike-sport-shoes",
    "sku": "NIKE-001",
    "price": 1500000,
    "status": "active",
    "hasVariants": false,
    "isInStock": true,
    "isLowStock": false,
    "...": "..."
  }
}
```

**Error Response (409 - Duplicate Slug):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Product with this slug already exists"
}
```

**Error Response (409 - Duplicate SKU):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Product with this SKU already exists"
}
```

**Error Response (400 - Invalid Category):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Category not found"
}
```

---

### Update Product

```http
PATCH /admin/products/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Request Body (all fields optional):**

```json
{
  "name": "کفش ورزشی نایکی - ویرایش شده",
  "slug": "nike-sport-shoes-updated",
  "description": "توضیحات جدید",
  "price": 1600000,
  "compareAtPrice": 2100000,
  "quantity": 150,
  "status": "active",
  "images": ["https://example.com/new-image.jpg"],
  "categoryId": "new-category-uuid"
}
```

> **Note:** Updating `variants` through product update is not supported. Use the dedicated variant endpoints instead.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "کفش ورزشی نایکی - ویرایش شده",
    "...": "..."
  }
}
```

---

### Delete Product (Soft Delete)

```http
DELETE /admin/products/:id
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null
}
```

---

### Restore Deleted Product

```http
PATCH /admin/products/:id/restore
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product restored successfully",
  "data": {
    "id": "product-uuid",
    "name": "کفش ورزشی نایکی",
    "...": "..."
  }
}
```

---

### Bulk Delete Products

```http
POST /admin/products/bulk/delete
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

> **Note:** Maximum 100 IDs per request.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "success": 3,
    "failed": 0,
    "failedIds": []
  }
}
```

---

### Bulk Restore Products

```http
POST /admin/products/bulk/restore
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Bulk restore completed",
  "data": {
    "success": 2,
    "failed": 1,
    "failedIds": ["uuid-3"]
  }
}
```

---

## Product Variants APIs

Manage variants for products that have multiple options (size, color, etc.).

### Add Variant to Product

```http
POST /admin/products/:id/variants
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-255 characters |
| `sku` | string | Yes | 1-100 characters, unique |
| `price` | number | Yes | Minimum: 0 |
| `quantity` | number | No | Default: 0 |
| `attributes` | object | No | Key-value pairs |
| `image` | string | No | Image URL |
| `isActive` | boolean | No | Default: `true` |

**Example Request:**

```json
{
  "name": "سبز - سایز XL",
  "sku": "TSHIRT-001-GREEN-XL",
  "price": 370000,
  "quantity": 10,
  "attributes": {
    "color": "سبز",
    "size": "XL"
  },
  "image": "https://example.com/green-xl.jpg",
  "isActive": true
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Variant created successfully",
  "data": {
    "id": "new-variant-uuid",
    "productId": "product-uuid",
    "name": "سبز - سایز XL",
    "sku": "TSHIRT-001-GREEN-XL",
    "price": 370000,
    "quantity": 10,
    "attributes": {
      "color": "سبز",
      "size": "XL"
    },
    "image": "https://example.com/green-xl.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (409 - Duplicate SKU):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Variant with this SKU already exists"
}
```

---

### List Product Variants

```http
GET /admin/products/:id/variants
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Variants retrieved successfully",
  "data": [
    {
      "id": "variant-uuid-1",
      "productId": "product-uuid",
      "name": "قرمز - سایز M",
      "sku": "TSHIRT-001-RED-M",
      "price": 350000,
      "quantity": 20,
      "attributes": { "color": "قرمز", "size": "M" },
      "image": null,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "variant-uuid-2",
      "productId": "product-uuid",
      "name": "آبی - سایز L",
      "sku": "TSHIRT-001-BLUE-L",
      "price": 360000,
      "quantity": 15,
      "attributes": { "color": "آبی", "size": "L" },
      "image": "https://example.com/blue-l.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Update Product Variant

```http
PATCH /admin/products/:id/variants/:variantId
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |
| `variantId` | UUID | Variant ID |

**Request Body (all fields optional):**

```json
{
  "name": "قرمز - سایز M - ویرایش شده",
  "sku": "TSHIRT-001-RED-M-V2",
  "price": 380000,
  "quantity": 30,
  "attributes": {
    "color": "قرمز",
    "size": "M",
    "material": "نخ"
  },
  "image": "https://example.com/updated-image.jpg",
  "isActive": true
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Variant updated successfully",
  "data": {
    "id": "variant-uuid",
    "productId": "product-uuid",
    "name": "قرمز - سایز M - ویرایش شده",
    "...": "..."
  }
}
```

---

### Delete Product Variant

```http
DELETE /admin/products/:id/variants/:variantId
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Product ID |
| `variantId` | UUID | Variant ID |

> **Note:** If this is the last variant, the product's `hasVariants` flag will automatically be set to `false`.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Variant deleted successfully",
  "data": null
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Variant not found"
}
```

---

## File Upload APIs

All upload endpoints require authentication. Images are stored on the server and accessible via URL.

### Upload Category Image

```http
POST /upload/category
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file (JPEG, PNG, GIF, WebP) |

**Limits:**
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

**Success Response (201):**

```json
{
  "success": true,
  "message": "Category image uploaded successfully",
  "data": {
    "originalName": "category-banner.jpg",
    "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "path": "categories/550e8400-e29b-41d4-a716-446655440000.jpg",
    "url": "/uploads/categories/550e8400-e29b-41d4-a716-446655440000.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

**Error Response (400 - Invalid File):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

---

### Upload Product Image

```http
POST /upload/product
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Same format as category upload. Files stored in `products/` directory.

**Success Response (201):**

```json
{
  "success": true,
  "message": "Product image uploaded successfully",
  "data": {
    "originalName": "product-photo.jpg",
    "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "path": "products/550e8400-e29b-41d4-a716-446655440000.jpg",
    "url": "/uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg",
    "size": 204800,
    "mimeType": "image/jpeg"
  }
}
```

---

### Delete Uploaded File

```http
DELETE /upload/:category/:filename
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| `category` | `avatars`, `products`, `categories`, or `general` |
| `filename` | The filename returned from upload |

**Example:**

```
DELETE /upload/categories/550e8400-e29b-41d4-a716-446655440000.jpg
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": null
}
```

---

### Upload Response DTO

```typescript
interface UploadResponse {
  originalName: string;  // Original file name
  filename: string;      // Generated unique filename (UUID)
  path: string;          // Relative path (e.g., "categories/uuid.jpg")
  url: string;           // Full URL path (e.g., "/uploads/categories/uuid.jpg")
  size: number;          // File size in bytes
  mimeType: string;      // MIME type (e.g., "image/jpeg")
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error message",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/products"
}
```

### HTTP Status Codes

| Code | Status | Description | Action |
|------|--------|-------------|--------|
| 200 | OK | Request successful | Process response data |
| 201 | Created | Resource created | Process response data |
| 400 | Bad Request | Invalid input/validation failed | Display validation errors |
| 401 | Unauthorized | Missing or invalid token | Redirect to login |
| 403 | Forbidden | Insufficient permissions | Show access denied message |
| 404 | Not Found | Resource doesn't exist | Show not found message |
| 409 | Conflict | Duplicate entry (slug, SKU) | Show conflict message |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff/retry |
| 500 | Internal Server Error | Server error | Show generic error message |

### Validation Error Example

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name must be longer than or equal to 2 characters",
    "slug must be a string",
    "price must be a positive number",
    "sku must be unique"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/products"
}
```

---

## Quick Reference

### Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/categories` | List categories (paginated) |
| GET | `/admin/categories/tree` | Get category tree structure |
| GET | `/admin/categories/simple` | Simple list for dropdowns |
| GET | `/admin/categories/stats` | Get category statistics |
| GET | `/admin/categories/:id` | Get single category |
| POST | `/admin/categories` | Create category |
| PATCH | `/admin/categories/:id` | Update category |
| DELETE | `/admin/categories/:id` | Delete category (soft) |
| PATCH | `/admin/categories/:id/restore` | Restore category |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/products` | List products (paginated) |
| GET | `/admin/products/stats` | Get product statistics |
| GET | `/admin/products/:id` | Get single product |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product (soft) |
| PATCH | `/admin/products/:id/restore` | Restore product |
| POST | `/admin/products/bulk/delete` | Bulk delete products |
| POST | `/admin/products/bulk/restore` | Bulk restore products |

### Variant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/products/:id/variants` | List product variants |
| POST | `/admin/products/:id/variants` | Add variant to product |
| PATCH | `/admin/products/:id/variants/:variantId` | Update variant |
| DELETE | `/admin/products/:id/variants/:variantId` | Delete variant |

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/category` | Upload category image |
| POST | `/upload/product` | Upload product image |
| DELETE | `/upload/:category/:filename` | Delete uploaded file |

---

## TypeScript Interfaces

For frontend TypeScript projects, here are the recommended interfaces:

```typescript
// Enums
enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

// Category
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface SimpleCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

// Product Variant
interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product
interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  quantity: number;
  lowStockThreshold: number;
  weight?: number;
  status: ProductStatus;
  images: string[];
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  hasVariants: boolean;
  variants?: ProductVariant[];
  metadata?: Record<string, any>;
  isInStock: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  failedIds: string[];
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
}

// Create/Update DTOs
interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  quantity?: number;
  lowStockThreshold?: number;
  weight?: number;
  status?: ProductStatus;
  images?: string[];
  categoryId?: string;
  hasVariants?: boolean;
  variants?: CreateVariantDto[];
  metadata?: Record<string, any>;
}

interface CreateVariantDto {
  name: string;
  sku: string;
  price: number;
  quantity?: number;
  attributes?: Record<string, string>;
  image?: string;
  isActive?: boolean;
}
```
