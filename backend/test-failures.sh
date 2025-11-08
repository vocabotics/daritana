#!/bin/bash

echo "=== Test 1: Protected route without token (should return 401) ==="
curl -s -w "\nStatus: %{http_code}\n" http://localhost:7001/api/settings

echo ""
echo "=== Test 2: Protected route with invalid token (should return 401) ==="
curl -s -w "\nStatus: %{http_code}\n" -H "Authorization: Bearer invalid_token_123" http://localhost:7001/api/settings

echo ""
echo "=== Test 3: Login and get token ==="
RESPONSE=$(curl -s -X POST http://localhost:7001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@daritana.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token obtained: ${TOKEN:0:30}..."

echo ""
echo "=== Test 4: Update user profile ==="
curl -s -w "\nStatus: %{http_code}\n" -X PUT http://localhost:7001/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Admin","lastName":"User"}'

echo ""
echo "=== Test 5: Get documents ==="
curl -s -w "\nStatus: %{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:7001/api/documents

echo ""
echo "=== Test 6: Get document statistics ==="
curl -s -w "\nStatus: %{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:7001/api/documents/statistics

echo ""
echo "=== Test 7: Mark all notifications as read ==="
curl -s -w "\nStatus: %{http_code}\n" -X PATCH http://localhost:7001/api/notifications/mark-all-read \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== Test 8: Get settings (should persist) ==="
curl -s http://localhost:7001/api/settings \
  -H "Authorization: Bearer $TOKEN"
