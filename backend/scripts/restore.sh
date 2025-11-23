#!/bin/bash
# Restore script for MongoDB
# Restores the dump into a local database called "marketplace_restore"

set -e

echo "Starting restore into local database 'marketplace_restore'..."

mongorestore \
  --db=marketplace_restore \
  ./backup/marketplace

echo "✅ Restore completed."
echo "Local database name: marketplace_restore"
