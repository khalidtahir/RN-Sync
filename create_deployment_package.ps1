# Create a deployment package for AWS Lambda

$zipName = "deployment_package.zip"

# Remove existing zip if it exists
if (Test-Path $zipName) {
    Remove-Item $zipName
}

# Create the zip file containing 'src' and 'package.json'
# We need package.json so AWS knows to use ES Modules (import/export)
Compress-Archive -Path src, package.json -DestinationPath $zipName

Write-Host "Created $zipName"
Write-Host "----------------------------------------------------------------"
Write-Host "INSTRUCTIONS FOR AWS LAMBDA:"
Write-Host "1. Go to the AWS Console -> Lambda."
Write-Host "2. For EACH function (websocket-handler, api-handler, auth-handler):"
Write-Host "   a. Click 'Upload from' -> '.zip file' and upload $zipName."
Write-Host "   b. Scroll down to 'Runtime settings' and click 'Edit'."
Write-Host "   c. Update the 'Handler' path:"
Write-Host "      - websocket-handler: src/handlers/websocket-handler.handler"
Write-Host "      - api-handler:       src/handlers/api-handler.handler"
Write-Host "      - auth-handler:      src/handlers/auth-handler.handler"
Write-Host "----------------------------------------------------------------"
