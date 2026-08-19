#!/usr/bin/env bash
# dummy_cycle.sh – run integration_check.js twice with a short pause

set -e

echo "Running first integration check..."
node integration_check.js

echo "Waiting 5 seconds before second run..."
sleep 5

echo "Running second integration check..."
node integration_check.js

echo "Dummy traffic cycles completed."
