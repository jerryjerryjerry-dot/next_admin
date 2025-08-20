// 扩展的Prisma类型定义，用于Watermark模块


// User 完整类型 (从现有系统继承)
export interface PrismaUser {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// WatermarkPolicy 完整类型
export interface PrismaWatermarkPolicy {
  id: string;
  name: string;
  fileTypes: string; // JSON字符串
  sensitivity: string; // "high" | "medium" | "low"
  embedDepth: number;
  description?: string | null;
  isDefault: boolean;
  status: string; // "active" | "disabled"
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  // Relations (optional in queries)
  createdBy?: PrismaUser;
  records?: PrismaWatermarkRecord[];
}

// WatermarkRecord 完整类型
export interface PrismaWatermarkRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileHash?: string | null;
  fileUrl: string;
  operation: string; // "embed" | "extract"
  policyId?: string | null;
  watermarkText?: string | null;
  taskId?: string | null;
  status: string; // "pending" | "processing" | "completed" | "failed"
  progress: number; // 0-100
  result?: string | null; // JSON string
  metadata?: string | null; // JSON string
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  // Relations (optional in queries)
  policy?: PrismaWatermarkPolicy | null;
  createdBy?: PrismaUser;
}

// Prisma 查询参数类型
export interface PrismaFindManyArgs<T> {
  where?: T;
  include?: Record<string, boolean | Record<string, unknown>>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
  skip?: number;
  take?: number;
}

// 水印策略 Where 条件
export interface WatermarkPolicyWhereInput {
  id?: string;
  name?: { contains?: string };
  status?: string;
  sensitivity?: string;
  createdById?: string;
  isDefault?: boolean;
  AND?: WatermarkPolicyWhereInput[];
  OR?: WatermarkPolicyWhereInput[];
}

// 水印记录 Where 条件
export interface WatermarkRecordWhereInput {
  id?: string;
  fileName?: { contains?: string };
  operation?: string;
  status?: string;
  policyId?: string;
  createdById?: string;
  watermarkText?: { contains?: string };
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
  AND?: WatermarkRecordWhereInput[];
  OR?: WatermarkRecordWhereInput[];
}

// 创建输入类型
export interface WatermarkPolicyCreateInput {
  name: string;
  fileTypes: string;
  sensitivity: string;
  embedDepth: number;
  description?: string;
  isDefault?: boolean;
  status?: string;
  createdById: string;
}

export interface WatermarkRecordCreateInput {
  fileName: string;
  fileSize: number;
  fileHash?: string;
  fileUrl: string;
  operation: string;
  policyId?: string;
  watermarkText?: string;
  taskId?: string;
  status?: string;
  progress?: number;
  result?: string;
  metadata?: string;
  errorMessage?: string;
  createdById: string;
}

// 更新输入类型
export interface WatermarkPolicyUpdateInput {
  name?: string;
  fileTypes?: string;
  sensitivity?: string;
  embedDepth?: number;
  description?: string;
  isDefault?: boolean;
  status?: string;
}

export interface WatermarkRecordUpdateInput {
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  fileUrl?: string;
  operation?: string;
  policyId?: string;
  watermarkText?: string;
  taskId?: string;
  status?: string;
  progress?: number;
  result?: string;
  metadata?: string;
  errorMessage?: string;
}

// 扩展的Prisma客户端类型
export interface ExtendedWatermarkPrismaClient {
  watermarkPolicy: {
    findMany: (args?: PrismaFindManyArgs<WatermarkPolicyWhereInput>) => Promise<PrismaWatermarkPolicy[]>;
    findUnique: (args: { where: { id: string }; include?: Record<string, boolean | Record<string, unknown>> }) => Promise<PrismaWatermarkPolicy | null>;
    create: (args: { data: WatermarkPolicyCreateInput }) => Promise<PrismaWatermarkPolicy>;
    update: (args: { where: { id: string }; data: WatermarkPolicyUpdateInput }) => Promise<PrismaWatermarkPolicy>;
    delete: (args: { where: { id: string } }) => Promise<PrismaWatermarkPolicy>;
    count: (args?: { where?: WatermarkPolicyWhereInput }) => Promise<number>;
  };
  watermarkRecord: {
    findMany: (args?: PrismaFindManyArgs<WatermarkRecordWhereInput>) => Promise<PrismaWatermarkRecord[]>;
    findUnique: (args: { where: { id: string }; include?: Record<string, boolean | Record<string, unknown>> }) => Promise<PrismaWatermarkRecord | null>;
    create: (args: { data: WatermarkRecordCreateInput }) => Promise<PrismaWatermarkRecord>;
    update: (args: { where: { id: string }; data: WatermarkRecordUpdateInput }) => Promise<PrismaWatermarkRecord>;
    delete: (args: { where: { id: string } }) => Promise<PrismaWatermarkRecord>;
    count: (args?: { where?: WatermarkRecordWhereInput }) => Promise<number>;
  };
}

// 外部API响应类型
export interface WatermarkTaskResponse {
  success: boolean;
  message?: string;
  data?: {
    task_status?: "pending" | "processing" | "finished" | "failed";
    task_id?: string;
    result?: {
      message?: string;
      data?: string; // 下载链接或提取结果
    };
  };
}
