@echo off
REM RN-Sync Backend API Testing Script for Windows
REM Usage: test-api.cmd

setlocal enabledelayedexpansion

set API_URL=http://localhost:5000
set TESTS_PASSED=0
set TESTS_FAILED=0

echo.
echo ==========================================
echo RN-Sync Backend API Test Suite
echo ==========================================
echo API Base URL: %API_URL%
echo.

REM Test 1: Health Check
echo Test 1: Health Check
curl -s %API_URL%/health
if %ERRORLEVEL% equ 0 (
    set /a TESTS_PASSED+=1
) else (
    set /a TESTS_FAILED+=1
)
echo.

REM Test 2: Get All Patients
echo Test 2: Get All Patients
curl -s %API_URL%/api/patients
echo.

REM Test 3: Create Patient
echo Test 3: Create Patient
for /f "delims=" %%i in ('curl -s -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test Patient\",\"bed\":\"ICU-99\"}" %API_URL%/api/patients') do (
    set patient_response=%%i
)
echo Response: %patient_response%
echo.

echo ==========================================
echo Note: For full automated testing, use bash or Python
echo Run: npm run test-api (if configured in package.json)
echo ==========================================
