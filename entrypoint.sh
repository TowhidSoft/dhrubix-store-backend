#!/bin/sh
# Run Prisma db push (or migrate) before starting the app
npx prisma db push
# Then start the application
exec npm start