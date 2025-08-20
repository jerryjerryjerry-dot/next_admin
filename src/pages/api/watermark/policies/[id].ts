import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '无效的策略ID'
      });
    }

    if (req.method === 'GET') {
      // 获取单个策略
      const policy = await db.watermarkPolicy.findUnique({
        where: { id },
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

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: '策略不存在'
        });
      }

      res.status(200).json({
        success: true,
        data: policy
      });

    } else if (req.method === 'PUT') {
      // 更新策略
      const { 
        name, 
        description, 
        watermarkText, 
        opacity, 
        fontSize, 
        color, 
        position, 
        isActive, 
        fileTypes, 
        sensitivity, 
        embedDepth 
      } = req.body as {
        name?: string;
        description?: string;
        watermarkText?: string;
        opacity?: number;
        fontSize?: number;
        color?: string;
        position?: string;
        isActive?: boolean;
        fileTypes?: string;
        sensitivity?: string;
        embedDepth?: number;
      };

      // 检查策略是否存在
      const existingPolicy = await db.watermarkPolicy.findUnique({
        where: { id }
      });

      if (!existingPolicy) {
        return res.status(404).json({
          success: false,
          message: '策略不存在'
        });
      }

      // 构建更新数据
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (watermarkText !== undefined) updateData.watermarkText = watermarkText;
      if (opacity !== undefined) updateData.opacity = opacity;
      if (fontSize !== undefined) updateData.fontSize = fontSize;
      if (color !== undefined) updateData.color = color;
      if (position !== undefined) updateData.position = position;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (fileTypes !== undefined) updateData.fileTypes = fileTypes;
      if (sensitivity !== undefined) updateData.sensitivity = sensitivity;
      if (embedDepth !== undefined) updateData.embedDepth = embedDepth;

      // 更新策略
      const updatedPolicy = await db.watermarkPolicy.update({
        where: { id },
        data: updateData,
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

      res.status(200).json({
        success: true,
        data: updatedPolicy,
        message: '策略更新成功'
      });

    } else if (req.method === 'DELETE') {
      // 删除策略
      const existingPolicy = await db.watermarkPolicy.findUnique({
        where: { id }
      });

      if (!existingPolicy) {
        return res.status(404).json({
          success: false,
          message: '策略不存在'
        });
      }

      // 检查是否有关联的记录
      const recordCount = await db.watermarkRecord.count({
        where: { policyId: id }
      });

      if (recordCount > 0) {
        return res.status(400).json({
          success: false,
          message: `无法删除策略，还有 ${recordCount} 条记录正在使用此策略`
        });
      }

      // 删除策略
      await db.watermarkPolicy.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: '策略删除成功'
      });

    } else {
      res.status(405).json({ 
        success: false, 
        message: '不支持的请求方法' 
      });
    }
  } catch (error) {
    console.error('策略操作API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}
