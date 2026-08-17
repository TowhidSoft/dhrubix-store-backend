#!/bin/sh
# Run Prisma db push (or migrate) before starting the app
pnpm prisma db push
# Then start the application
exec pnpm start