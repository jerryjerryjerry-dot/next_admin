-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Post_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TrafficDyeingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "appType" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "targetIp" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dyeResult" TEXT,
    "traceInfo" TEXT,
    "reportData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "TrafficDyeingRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "appCount" INTEGER NOT NULL DEFAULT 0,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "app_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "app_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appName" TEXT NOT NULL,
    "appType" TEXT NOT NULL,
    "categoryPath" TEXT NOT NULL,
    "ip" TEXT,
    "domain" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "app_entries_appType_fkey" FOREIGN KEY ("appType") REFERENCES "app_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_learn_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT,
    "domain" TEXT,
    "url" TEXT,
    "predictedType" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enabled',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestSchema" TEXT NOT NULL,
    "responseSchema" TEXT NOT NULL,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "rateLimit" INTEGER,
    "requireAuth" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_endpoints_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "api_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "accessKeyId" TEXT NOT NULL,
    "accessKeySecret" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "quotaLimit" INTEGER,
    "quotaUsed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "parameters" TEXT,
    "response" TEXT,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "userAgent" TEXT,
    "clientIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_calls_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "api_calls_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "api_endpoints" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "watermark_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fileTypes" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL,
    "embedDepth" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "watermark_policies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "watermark_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT,
    "fileUrl" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "policyId" TEXT,
    "watermarkText" TEXT,
    "taskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "metadata" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "watermark_records_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "watermark_policies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "watermark_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Post_name_idx" ON "Post"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "TrafficDyeingRule_status_idx" ON "TrafficDyeingRule"("status");

-- CreateIndex
CREATE INDEX "TrafficDyeingRule_appType_idx" ON "TrafficDyeingRule"("appType");

-- CreateIndex
CREATE INDEX "TrafficDyeingRule_createdById_idx" ON "TrafficDyeingRule"("createdById");

-- CreateIndex
CREATE INDEX "app_categories_parentId_idx" ON "app_categories"("parentId");

-- CreateIndex
CREATE INDEX "app_categories_level_idx" ON "app_categories"("level");

-- CreateIndex
CREATE INDEX "app_entries_appType_idx" ON "app_entries"("appType");

-- CreateIndex
CREATE INDEX "app_entries_status_idx" ON "app_entries"("status");

-- CreateIndex
CREATE INDEX "app_entries_isBuiltIn_idx" ON "app_entries"("isBuiltIn");

-- CreateIndex
CREATE INDEX "app_entries_ip_idx" ON "app_entries"("ip");

-- CreateIndex
CREATE INDEX "app_entries_domain_idx" ON "app_entries"("domain");

-- CreateIndex
CREATE INDEX "ai_learn_suggestions_status_idx" ON "ai_learn_suggestions"("status");

-- CreateIndex
CREATE INDEX "ai_learn_suggestions_confidence_idx" ON "ai_learn_suggestions"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "api_categories_name_key" ON "api_categories"("name");

-- CreateIndex
CREATE INDEX "api_categories_status_idx" ON "api_categories"("status");

-- CreateIndex
CREATE INDEX "api_categories_sortOrder_idx" ON "api_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "api_endpoints_categoryId_idx" ON "api_endpoints"("categoryId");

-- CreateIndex
CREATE INDEX "api_endpoints_status_idx" ON "api_endpoints"("status");

-- CreateIndex
CREATE INDEX "api_endpoints_method_idx" ON "api_endpoints"("method");

-- CreateIndex
CREATE UNIQUE INDEX "api_endpoints_endpoint_method_key" ON "api_endpoints"("endpoint", "method");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_accessKeyId_key" ON "api_keys"("accessKeyId");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_status_idx" ON "api_keys"("status");

-- CreateIndex
CREATE INDEX "api_keys_accessKeyId_idx" ON "api_keys"("accessKeyId");

-- CreateIndex
CREATE INDEX "api_calls_apiKeyId_idx" ON "api_calls"("apiKeyId");

-- CreateIndex
CREATE INDEX "api_calls_endpointId_idx" ON "api_calls"("endpointId");

-- CreateIndex
CREATE INDEX "api_calls_createdAt_idx" ON "api_calls"("createdAt");

-- CreateIndex
CREATE INDEX "api_calls_success_idx" ON "api_calls"("success");

-- CreateIndex
CREATE INDEX "watermark_policies_status_idx" ON "watermark_policies"("status");

-- CreateIndex
CREATE INDEX "watermark_policies_createdById_idx" ON "watermark_policies"("createdById");

-- CreateIndex
CREATE INDEX "watermark_records_status_idx" ON "watermark_records"("status");

-- CreateIndex
CREATE INDEX "watermark_records_operation_idx" ON "watermark_records"("operation");

-- CreateIndex
CREATE INDEX "watermark_records_createdById_idx" ON "watermark_records"("createdById");

-- CreateIndex
CREATE INDEX "watermark_records_createdAt_idx" ON "watermark_records"("createdAt");
