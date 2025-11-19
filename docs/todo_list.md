# AWS Lambda Setup To-Do List

Follow these steps to create the necessary serverless functions for RN Sync.

## 1. Create `websocket-handler` Function
This function will handle real-time connections and data ingestion.

- [ ] **Navigate to Lambda Console**: Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions).
- [ ] **Click "Create function"**.
- [ ] **Select "Author from scratch"**.
- [ ] **Basic Information**:
    -   **Function name**: `websocket-handler`
    -   **Runtime**: `Node.js 20.x`
    -   **Architecture**: `x86_64` (default)
- [ ] **Permissions**:
    -   Leave "Change default execution role" as "Create a new role with basic Lambda permissions".
- [ ] **Click "Create function"** (bottom right).

## 2. Create `api-handler` Function
This function will handle REST API requests (e.g., fetching history).

- [ ] **Go back to Functions List**: Click "Functions" in the breadcrumb or sidebar.
- [ ] **Click "Create function"**.
# AWS Lambda Setup To-Do List

Follow these steps to create the necessary serverless functions for RN Sync.

## 1. Create `websocket-handler` Function
This function will handle real-time connections and data ingestion.

- [ ] **Navigate to Lambda Console**: Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions).
- [ ] **Click "Create function"**.
- [ ] **Select "Author from scratch"**.
- [ ] **Basic Information**:
    -   **Function name**: `websocket-handler`
    -   **Runtime**: `Node.js 20.x`
    -   **Architecture**: `x86_64` (default)
- [ ] **Permissions**:
    -   Leave "Change default execution role" as "Create a new role with basic Lambda permissions".
- [ ] **Click "Create function"** (bottom right).

## 2. Create `api-handler` Function
This function will handle REST API requests (e.g., fetching history).

- [ ] **Go back to Functions List**: Click "Functions" in the breadcrumb or sidebar.
- [ ] **Click "Create function"**.
- [ ] **Select "Author from scratch"**.
- [ ] **Basic Information**:
    -   **Function name**: `api-handler`
    -   **Runtime**: `Node.js 20.x`
- [ ] **Click "Create function"**.

## 5. Create API Gateway (HTTP)
This allows your app to fetch history via REST.

- [ ] **Navigate to API Gateway**: Go to [AWS API Gateway Console](https://console.aws.amazon.com/apigateway/main/apis?region=us-east-2).
- [ ] **Create API**:
    -   Find **HTTP API** (NOT REST API, HTTP is cheaper/simpler) and click **Build**.
- [ ] **Step 1: Create API**:
    -   **API name**: `rn-sync-api`
    -   Click **Next**.
- [ ] **Step 2: Integrations**:
    -   Click **Add integration**.
    -   Choose **Lambda**.
    -   Select `api-handler`.
    -   Click **Next**.
- [ ] **Step 3: Configure routes**:
    -   Method: `GET`
    -   Resource path: `/history`
    -   Integration target: `api-handler`
    -   Click **Next**.
- [ ] **Step 4: Stages**:
    -   Leave as `$default` (Auto-deploy enabled).
    -   Click **Next**.
- [ ] **Step 5: Review**:
    -   Click **Create**.
- [ ] **Get URL**: Copy the **Invoke URL** (e.g., `https://...`).

## 6. Connect Supabase (Crucial Step)
Now we connect your AWS backend to the database.

- [ ] **Get Credentials**: Ask your teammate for:
    -   `SUPABASE_URL` (e.g., `https://xyz.supabase.co`)
    -   `SUPABASE_KEY` (The `service_role` key is best for backend, or `anon` if RLS is open)
    -   `TABLE_NAME` (e.g., `sensor_readings`)
- [ ] **Configure `websocket-handler`**:
    -   Go to Lambda Console -> `websocket-handler` -> **Configuration** -> **Environment variables**.
    -   Click **Edit**.
    -   Add `SUPABASE_URL`, `SUPABASE_KEY`, and `TABLE_NAME`.
    -   Click **Save**.
- [ ] **Configure `api-handler`**:
    -   Go to Lambda Console -> `api-handler` -> **Configuration** -> **Environment variables**.
    -   Click **Edit**.
    -   Add the SAME variables.
    -   Click **Save**.

## 7. Secure HTTP API (Easy Mode)
We will use the built-in Cognito Authorizer.

- [ ] **Create Authorizer**:
    -   Go to API Gateway -> `rn-sync-api` (HTTP) -> **Authorization** (sidebar).
    -   Click **Manage authorizers** tab -> **Create**.
    -   Type: **JWT**.
    -   Name: `cognito-auth`.
    -   Identity source: `$request.header.Authorization`.
    -   Issuer URL: `https://cognito-idp.us-east-2.amazonaws.com/us-east-2_OAZaH0Kk9` (Replace with YOUR User Pool ID).
    -   Audience: `2n2bqionolrsftg1k7umtlh2aa` (Replace with YOUR App Client ID).
    -   Click **Create**.
- [ ] **Attach to Route**:
    -   Go to **Authorization** tab.
    -   Select the `GET /history` route.
    -   Click **Attach authorizer**.
    -   Select `cognito-auth`.
    -   Click **Attach authorizer**.
- [ ] **Test it**:
    -   Visit your HTTP URL again. You should now see `{"message":"Unauthorized"}`. This is GOOD! It means it's secure.

## 8. Secure WebSocket API (Advanced)
WebSockets need a special "Lambda Authorizer".

- [ ] **Create `auth-handler` Lambda**:
    -   Create a new function named `auth-handler` (Node.js 20.x).
    -   (I will provide the code for this in the next step).
- [ ] **Create Authorizer in API Gateway**:
    -   Go to `rn-sync-ws` -> **Authorizers** -> **Create Authorizer**.
    -   Name: `lambda-auth`.
    -   Lambda Function: `auth-handler`.
    -   **Lambda Invoke Role**: Leave blank.
    -   **Identity Source**:
        -   Click the dropdown that says "Header".
        -   Select **Query String**.
        -   In the "Key" box that appears, type: `token`.
    -   Click **Create**.
- [ ] **Attach to $connect**:
    -   Go to **Routes** -> `$connect`.
    -   Click **Route Request**.
    -   Under **Authorization**, select `lambda-auth`.
- [ ] **Deploy**:
    -   Click **Actions** -> **Deploy API** -> `dev`.

## 9. Update Simulator for Security
Now that the door is locked, we need to give the simulator a key.

- [ ] **Install AWS SDK**:
    -   Run: `npm install @aws-sdk/client-cognito-identity-provider`
- [ ] **Create a Test User**:
    -   Go to Cognito Console -> User Pools -> `rn-sync`.
    -   Click the **Users** tab.
    -   Click **Create user**.
    -   **Email address**: `testuser@example.com` (or whatever you want).
    -   **Password**: `Password123!` (Must be complex: Uppercase, Lowercase, Number, Symbol).
    -   **Mark email as verified**: Check this box (so you don't need to verify via email).
    -   Click **Create user**.
- [ ] **Update `simulator.js`**:
    -   I have updated the code. Open the file and check lines 24-25.
    -   Make sure `USERNAME` and `PASSWORD` match what you just created.
- [ ] **Run it**:
    -   `node simulator.js`
    -   It should say "Authentication successful!" and then connect.

## Troubleshooting: "USER_PASSWORD_AUTH flow not enabled"
If you see this error, you need to enable it in Cognito:
- [ ] Go to Cognito Console -> User Pools -> `rn-sync`.
- [ ] Click on the **App integration** tab.
- [ ] Scroll down to **App clients and analytics**.
- [ ] Click on `rn-sync-client`.
- [ ] Scroll down to **Authentication flows**.
- [ ] Click **Edit**.
- [ ] Check **ALLOW_USER_PASSWORD_AUTH**.
- [ ] Click **Save changes**.
- [ ] Run `node simulator.js` again.

## 10. Final Handoff
- [ ] Create `API_DOCUMENTATION.md` for your frontend team.
- [ ] Verify everything one last time.
