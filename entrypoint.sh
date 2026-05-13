#!/bin/bash
set -e

echo "Waiting for database to be ready..."
sleep 2

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run db:seed

echo "Starting Next.js..."
npm run start