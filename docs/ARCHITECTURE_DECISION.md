# Architecture Decision: Serverless Lambda Backend

**Date:** November 2025  
**Decision By:** Team consensus

## Decision

The RN Sync backend uses AWS Lambda serverless architecture rather than a traditional Express.js server.

## Team Contributions

All team members' work has been integrated into the final architecture:

### Khalid Tahir - Database Layer
- Designed complete PostgreSQL schema (patients, readings, files tables)
- Created migration and seed scripts
- Configured Supabase integration with SSL support
- **Status:** Schema actively used by all backend services

### Ziyad Soultan - Serverless Backend
- Implemented AWS Lambda handlers (API, WebSocket, Auth)
- Created service layer with business logic
- Built comprehensive testing suite (200+ test cases)
- Set up CI/CD pipeline with GitHub Actions
- **Status:** Deployed and operational

### Jack Fergusson - Frontend
- Developed React Native/Expo mobile application
- Implemented patient dashboard and authentication
- Created real-time data visualization components
- **Status:** Integrated and configured for Lambda endpoints

## Architecture Benefits

### Cost Efficiency
- $0/month for low traffic (AWS Free Tier: 1M requests/month)
- Pay-per-execution pricing model
- No server maintenance costs

### Scalability
- Automatic scaling based on demand
- Handles traffic spikes without configuration
- No manual load balancer setup required

### Developer Experience
- Automated deployments via GitHub Actions
- Comprehensive test coverage
- Clear separation of concerns (handlers vs services)

### Security
- Built-in AWS Cognito integration
- API Gateway authorization
- TLS 1.3 encryption by default

## How Components Work Together

1. **Database (Khalid's Schema)** → Deployed on Supabase
2. **Backend (Serverless)** → Lambda functions query Khalid's tables via Supabase REST API
3. **Frontend (Jack's App)** → Connects to Lambda endpoints for data operations

## Technical Details

- **Runtime:** Node.js 22.x on AWS Lambda
- **Database:** Supabase (PostgreSQL) with Khalid's schema
- **Authentication:** AWS Cognito OAuth 2.0
- **Deployment:** Automated via GitHub Actions
- **APIs:** 
  - HTTP: https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com
  - WebSocket: wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/

## Conclusion

This architecture leverages each team member's contributions while providing a modern, scalable, and cost-effective solution for the RN Sync platform.
