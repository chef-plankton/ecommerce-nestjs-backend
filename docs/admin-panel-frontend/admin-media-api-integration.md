# Admin Panel Media Management API Integration Guide

This document provides API documentation for frontend developers integrating media management (upload, list, delete) into the admin panel.

---

## Table of Contents

1. [Overview](#overview)
2. [Media Types](#media-types)
3. [List Media API](#list-media-api)
4. [Get Single Media](#get-single-media)
5. [Upload Media](#upload-media)
6. [Bulk Upload Media](#bulk-upload-media)
7. [Update Media Metadata](#update-media-metadata)
8. [Delete Media](#delete-media)
9. [Bulk Delete Media](#bulk-delete-media)
10. [Media Statistics](#media-statistics)
11. [Error Handling](#error-handling)
12. [Quick Reference](#quick-reference)
13. [TypeScript Interfaces](#typescript-interfaces)
14. [Frontend Implementation Tips](#frontend-implementation-tips)

---

## Overview

The media management module provides full CRUD operations for managing uploaded files (images) in the admin panel. All endpoints require authentication and admin/super_admin role.

### Required Headers

All requests must include:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <access_token>` | JWT access token |
| `Content-Type` | `application/json` | For JSON requests |
| `Content-Type` | `multipart/form-data` | For file upload requests |

### Required Role

All endpoints require one of the following roles:
- `admin`
- `super_admin`

### File Constraints

| Constraint | Value |
|------------|-------|
| Max file size | 5MB |
| Allowed types | JPEG, PNG, GIF, WebP |
| Max files per bulk upload | 10 |

---

## Media Types

Media files are categorized into types for better organization:

| Type | Value | Description | Storage Path |
|------|-------|-------------|--------------|
| Category | `category` | Category images | `/uploads/categories/` |
| Product | `product` | Product images | `/uploads/products/` |
| Avatar | `avatar` | User avatar images | `/uploads/avatars/` |
| General | `general` | Other general files | `/uploads/general/` |

---

## List Media API

Retrieve all media files with pagination, filtering, and search capabilities.

```http
GET /admin/media
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | createdAt | Sort field: `createdAt`, `updatedAt`, `originalName`, `size`, `type` |
| `sortOrder` | string | DESC | `ASC` or `DESC` |
| `search` | string | - | Search in originalName, alt, title |
| `type` | string | - | Filter by type: `category`, `product`, `avatar`, `general` |
| `includeDeleted` | boolean | - | Include soft-deleted media |
| `onlyDeleted` | boolean | - | Show only soft-deleted media |

### Example Request

```
GET /admin/media?page=1&limit=20&type=product&sortBy=createdAt&sortOrder=DESC
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "originalName": "product-image.jpg",
        "filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
        "path": "products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
        "url": "/uploads/products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
        "size": 102400,
        "mimeType": "image/jpeg",
        "type": "product",
        "alt": "Product main image",
        "title": "Nike Sport Shoes",
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

## Get Single Media

Retrieve a single media file by ID.

```http
GET /admin/media/:id
Authorization: Bearer <access_token>
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Media ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "product-image.jpg",
    "filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "path": "products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "url": "/uploads/products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "type": "product",
    "alt": "Product main image",
    "title": "Nike Sport Shoes",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "deletedAt": null
  }
}
```

### Error Response (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Media not found"
}
```

---

## Upload Media

Upload a single media file.

```http
POST /admin/media/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPEG, PNG, GIF, WebP, max 5MB) |
| `type` | string | Yes | Media type: `category`, `product`, `avatar`, `general` |
| `alt` | string | No | Alt text for accessibility (max 255 chars) |
| `title` | string | No | Title/caption for the media (max 500 chars) |

### Example Request (JavaScript/Fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'product');
formData.append('alt', 'Product main image');
formData.append('title', 'Nike Sport Shoes');

const response = await fetch('/api/v1/admin/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});
```

### Example Request (Axios)

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'product');
formData.append('alt', 'Product main image');

const response = await axios.post('/api/v1/admin/media/upload', formData, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'multipart/form-data',
  },
});
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "product-image.jpg",
    "filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "path": "products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "url": "/uploads/products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "type": "product",
    "alt": "Product main image",
    "title": "Nike Sport Shoes",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "deletedAt": null
  }
}
```

### Error Response (400 - Invalid File Type)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

### Error Response (400 - No File)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "No file uploaded"
}
```

### Error Response (400 - File Too Large)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "File too large. Maximum size is 5MB."
}
```

---

## Bulk Upload Media

Upload multiple media files at once.

```http
POST /admin/media/upload/bulk
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Array of image files (max 10 files) |
| `type` | string | Yes | Media type for all files |

### Example Request (JavaScript/Fetch)

```javascript
const formData = new FormData();

// Append multiple files
for (const file of fileInput.files) {
  formData.append('files', file);
}
formData.append('type', 'product');

const response = await fetch('/api/v1/admin/media/upload/bulk', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Media files uploaded successfully",
  "data": [
    {
      "id": "uuid-1",
      "originalName": "image1.jpg",
      "filename": "generated-uuid-1.jpg",
      "path": "products/generated-uuid-1.jpg",
      "url": "/uploads/products/generated-uuid-1.jpg",
      "size": 102400,
      "mimeType": "image/jpeg",
      "type": "product",
      "alt": null,
      "title": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "originalName": "image2.jpg",
      "filename": "generated-uuid-2.jpg",
      "path": "products/generated-uuid-2.jpg",
      "url": "/uploads/products/generated-uuid-2.jpg",
      "size": 204800,
      "mimeType": "image/jpeg",
      "type": "product",
      "alt": null,
      "title": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Update Media Metadata

Update media metadata (alt text and title).

```http
PATCH /admin/media/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Media ID |

### Request Body (all fields optional)

| Field | Type | Description |
|-------|------|-------------|
| `alt` | string | Alt text for accessibility (max 255 chars) |
| `title` | string | Title/caption for the media (max 500 chars) |

### Example Request

```json
{
  "alt": "Updated product image description",
  "title": "Nike Sport Shoes - Red Edition"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Media updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "product-image.jpg",
    "filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "path": "products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "url": "/uploads/products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "type": "product",
    "alt": "Updated product image description",
    "title": "Nike Sport Shoes - Red Edition",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## Delete Media

Permanently delete a single media file (removes from both database and disk).

```http
DELETE /admin/media/:id
Authorization: Bearer <access_token>
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Media ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Media deleted successfully",
  "data": null
}
```

### Error Response (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Media not found"
}
```

---

## Bulk Delete Media

Permanently delete multiple media files.

```http
DELETE /admin/media/bulk
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | string[] | Yes | Array of media IDs to delete (max 100) |

### Example Request

```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

### Success Response (200)

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

### Partial Success Response (200)

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "success": 2,
    "failed": 1,
    "failedIds": ["550e8400-e29b-41d4-a716-446655440002"]
  }
}
```

---

## Media Statistics

Get media usage statistics.

```http
GET /admin/media/stats
Authorization: Bearer <access_token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalMedia": 150,
    "byType": {
      "category": 25,
      "product": 100,
      "avatar": 15,
      "general": 10
    },
    "totalSize": 157286400
  }
}
```

> **Note:** `totalSize` is in bytes. To convert to MB: `totalSize / (1024 * 1024)`

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
  "path": "/api/v1/admin/media"
}
```

### HTTP Status Codes

| Code | Status | Description | Action |
|------|--------|-------------|--------|
| 200 | OK | Request successful | Process response data |
| 201 | Created | Media uploaded successfully | Process response data |
| 400 | Bad Request | Invalid input/file validation failed | Display validation errors |
| 401 | Unauthorized | Missing or invalid token | Redirect to login |
| 403 | Forbidden | Insufficient permissions | Show access denied message |
| 404 | Not Found | Media doesn't exist | Show not found message |
| 413 | Payload Too Large | File exceeds 5MB limit | Show file size error |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff/retry |
| 500 | Internal Server Error | Server error | Show generic error message |

---

## Quick Reference

### Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/media` | List media (paginated) |
| GET | `/admin/media/stats` | Get media statistics |
| GET | `/admin/media/:id` | Get single media |
| POST | `/admin/media/upload` | Upload single media |
| POST | `/admin/media/upload/bulk` | Upload multiple media |
| PATCH | `/admin/media/:id` | Update media metadata |
| DELETE | `/admin/media/:id` | Delete single media |
| DELETE | `/admin/media/bulk` | Bulk delete media |

---

## TypeScript Interfaces

For frontend TypeScript projects, use these interfaces:

```typescript
// Enums
enum MediaType {
  CATEGORY = 'category',
  PRODUCT = 'product',
  AVATAR = 'avatar',
  GENERAL = 'general',
}

// Media Response
interface Media {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  type: MediaType;
  alt?: string;
  title?: string;
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

interface BulkDeleteResult {
  success: number;
  failed: number;
  failedIds: string[];
}

interface MediaStats {
  totalMedia: number;
  byType: Record<MediaType, number>;
  totalSize: number;
}

// Query Parameters
interface MediaQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'originalName' | 'size' | 'type';
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  type?: MediaType;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}

// Upload DTO
interface UploadMediaDto {
  file: File;
  type: MediaType;
  alt?: string;
  title?: string;
}

// Update DTO
interface UpdateMediaDto {
  alt?: string;
  title?: string;
}

// Bulk Delete DTO
interface BulkDeleteMediaDto {
  ids: string[];
}
```

---

## Frontend Implementation Tips

### 1. File Validation Before Upload

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}
```

### 2. Progress Tracking for Uploads

```typescript
async function uploadWithProgress(
  file: File,
  type: MediaType,
  onProgress: (percent: number) => void
): Promise<Media> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.data);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', '/api/v1/admin/media/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
    xhr.send(formData);
  });
}
```

### 3. Drag and Drop Upload

```typescript
function setupDropZone(
  element: HTMLElement,
  onFilesDropped: (files: File[]) => void
) {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    element.classList.add('drag-over');
  });

  element.addEventListener('dragleave', () => {
    element.classList.remove('drag-over');
  });

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer?.files || []);
    const validFiles = files.filter(file => {
      const validation = validateFile(file);
      return validation.valid;
    });

    onFilesDropped(validFiles);
  });
}
```

### 4. Image Preview Before Upload

```typescript
function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 5. Building Full Image URL

```typescript
function getFullImageUrl(media: Media): string {
  const baseUrl = process.env.REACT_APP_API_URL || '';
  // media.url is like "/uploads/products/uuid.jpg"
  return `${baseUrl}${media.url}`;
}
```

### 6. Format File Size

```typescript
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Usage: formatFileSize(102400) => "100 KB"
```

### 7. React Hook Example

```typescript
import { useState, useCallback } from 'react';

interface UseMediaUpload {
  upload: (file: File, type: MediaType) => Promise<Media>;
  uploadMultiple: (files: File[], type: MediaType) => Promise<Media[]>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

function useMediaUpload(): UseMediaUpload {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, type: MediaType) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadWithProgress(file, type, setProgress);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[], type: MediaType) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('type', type);

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/admin/media/upload/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, uploadMultiple, isUploading, progress, error };
}
```

---

## Media Gallery Component Structure

Recommended component structure for a media gallery/picker:

```
MediaManager/
├── MediaManager.tsx          # Main container
├── MediaGrid.tsx             # Grid display of media items
├── MediaItem.tsx             # Single media item card
├── MediaUploader.tsx         # Upload zone/button
├── MediaFilters.tsx          # Type filter, search, sort
├── MediaPagination.tsx       # Pagination controls
├── MediaDetails.tsx          # Detail modal/sidebar
├── MediaPicker.tsx           # Picker modal for selecting media
└── hooks/
    ├── useMediaList.ts       # Fetch and paginate media
    ├── useMediaUpload.ts     # Upload handling
    └── useMediaDelete.ts     # Delete handling
```

---

## API Base URL

Remember to configure your API base URL:

- Development: `http://localhost:3000/api/v1`
- Production: `https://your-domain.com/api/v1`

All media endpoints are prefixed with `/admin/media`.
