#!/usr/bin/env bash

# RN-Sync Backend API Testing Script
# This script tests all API endpoints
# Usage: bash test-api.sh

API_URL="http://localhost:5000"
VERBOSE=false

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to make API calls
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -e "\n${YELLOW}Testing:${NC} $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        if [ "$VERBOSE" = true ]; then
            echo "Response: $body" | head -n 20
        fi
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body" | head -n 20
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "=========================================="
echo "RN-Sync Backend API Test Suite"
echo "=========================================="
echo "API Base URL: $API_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test Suite 1: Health & Status${NC}"
test_endpoint "GET" "/health" "" "200"

# Test 2: Get All Patients
echo -e "\n${YELLOW}Test Suite 2: Patient Management${NC}"
test_endpoint "GET" "/api/patients" "" "200"

# Create a test patient
echo -e "\n${YELLOW}Creating test patient...${NC}"
patient_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Patient","bed":"ICU-99"}' \
    "$API_URL/api/patients")

# Extract patient ID from response
PATIENT_ID=$(echo "$patient_response" | grep -o '"id":"[^"]*' | head -1 | grep -o '[^"]*$')

if [ -z "$PATIENT_ID" ]; then
    echo -e "${RED}✗ Failed to create test patient${NC}"
    echo "Response: $patient_response"
else
    echo -e "${GREEN}✓ Created test patient: $PATIENT_ID${NC}"
fi

# Test 3: Get Specific Patient
if [ ! -z "$PATIENT_ID" ]; then
    test_endpoint "GET" "/api/patients/$PATIENT_ID" "" "200"
    
    # Test 4: Add Reading
    echo -e "\n${YELLOW}Test Suite 3: Readings Management${NC}"
    test_endpoint "POST" "/api/patients/$PATIENT_ID/readings" \
        '{"metric":"heart_rate","value":82,"unit":"bpm"}' "201"
    
    # Test 5: Get Patient History
    test_endpoint "GET" "/api/patients/$PATIENT_ID/history" "" "200"
    
    # Test 6: Get Patient History with Filters
    test_endpoint "GET" "/api/patients/$PATIENT_ID/history?metric=heart_rate" "" "200"
    
    # Test 7: Add File
    echo -e "\n${YELLOW}Test Suite 4: File Management${NC}"
    test_endpoint "POST" "/api/patients/$PATIENT_ID/files" \
        '{"file_name":"test.pdf","file_type":"pdf","storage_url":"s3://bucket/test.pdf"}' "201"
    
    # Test 8: Get Patient Files
    test_endpoint "GET" "/api/patients/$PATIENT_ID/files" "" "200"
fi

# Test 9: Invalid Endpoints
echo -e "\n${YELLOW}Test Suite 5: Error Handling${NC}"
test_endpoint "GET" "/api/patients/nonexistent-id" "" "404"
test_endpoint "GET" "/nonexistent-route" "" "404"

# Test 10: Invalid POST Data
test_endpoint "POST" "/api/patients" '{"name":"Test"}' "400"

# Print Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
