#!/bin/bash
# Backup script for MongoDB Atlas -> local dump
# Creates a dump of the "marketplace" database into ./backup/marketplace

set -e

echo "Starting backup of Atlas database 'marketplace'..."

mongodump \
  --uri="mongodb+srv://Mohammed:37383393@cluster0.jts9rbc.mongodb.net/marketplace" \
  --out=./backup

echo "✅ Backup completed."
echo "Dump is stored in ./backup/marketplace"
