import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // 获取策略列表
      const { active } = req.query;
      
      // 从数据库获取策略
      const whereCondition = active === 'true' ? { isActive: true } : {};
      
      const policies = await db.watermarkPolicy.findMany({
        where: whereCondition,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({
        success: true,
        data: policies,
        total: policies.length
      });

    } else if (req.method === 'POST') {
      // 创建新策略
      const { 
        name, 
        description, 
        watermarkText, 
        opacity, 
        fontSize, 
        color, 
        position, 
        fileTypes, 
        sensitivity, 
        embedDepth 
      } = req.body as {
        name: string;
        description?: string;
        watermarkText: string;
        opacity?: number;
        fontSize?: number;
        color?: string;
        position?: string;
        fileTypes?: string;
        sensitivity?: string;
        embedDepth?: number;
      };

      if (!name || !watermarkText) {
        return res.status(400).json({
          success: false,
          message: '策略名称和水印文本不能为空'
        });
      }

      // 获取一个管理员用户作为创建者
      const adminUser = await db.user.findFirst({
        where: { role: 'admin' }
      });

      if (!adminUser) {
        return res.status(500).json({
          success: false,
          message: '无法找到管理员用户'
        });
      }

      // 保存到数据库
      const newPolicy = await db.watermarkPolicy.create({
        data: {
          name,
          description: description ?? '',
          watermarkText,
          opacity: opacity ?? 0.3,
          fontSize: fontSize ?? 24,
          color: color ?? '#666666',
          position: position ?? 'center',
          fileTypes: fileTypes ?? 'all',
          sensitivity: sensitivity ?? 'medium',
          embedDepth: embedDepth ?? 5,
          isActive: true,
          createdById: adminUser.id
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: newPolicy,
        message: '策略创建成功'
      });

    } else {
      res.status(405).json({ 
        success: false, 
        message: '不支持的请求方法' 
      });
    }
  } catch (error) {
    console.error('策略管理API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}
