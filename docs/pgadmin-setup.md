# pgAdmin Setup Guide

This guide explains how to run and configure pgAdmin for database management.

## Prerequisites

- Docker and Docker Compose installed
- Project's `.env` file configured

## Starting pgAdmin

Run the following command from the project root:

```bash
docker-compose up -d
```

This starts both PostgreSQL and pgAdmin containers.

To start only pgAdmin (if PostgreSQL is already running):

```bash
docker-compose up -d pgadmin
```

## Accessing pgAdmin

- **URL:** http://localhost:5050
- **Email:** `admin@admin.com`
- **Password:** `admin`

## Connecting to the Database

1. Open http://localhost:5050 in your browser
2. Login with the credentials above
3. Right-click **Servers** → **Register** → **Server**
4. Configure the connection:

### General Tab
| Field | Value |
|-------|-------|
| Name  | `ecommerce_db` |

### Connection Tab
| Field    | Value |
|----------|-------|
| Host     | `postgres` |
| Port     | `5432` |
| Database | `ecommerce_db` |
| Username | `postgres` |
| Password | `postgres` |

5. Click **Save**

> **Note:** If `postgres` hostname doesn't work, try `host.docker.internal` instead.

## Stopping pgAdmin

```bash
docker-compose stop pgadmin
```

Or stop all services:

```bash
docker-compose down
```

## Troubleshooting

### Cannot connect to database
- Ensure PostgreSQL container is running: `docker ps`
- Check if PostgreSQL is healthy: `docker-compose ps`
- Verify the hostname is correct (`postgres` for Docker network)

### pgAdmin not accessible
- Check if port 5050 is available
- Verify container is running: `docker ps --filter "name=pgadmin"`
- Check logs: `docker logs ecommerce_pgadmin`

### Reset pgAdmin data
To reset pgAdmin configuration and data:

```bash
docker-compose down
docker volume rm ecommerce-backend_pgadmin_data
docker-compose up -d
```
