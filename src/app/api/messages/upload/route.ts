import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const transactionId = formData.get('transactionId') as string;
    const fileType = formData.get('type') as string || 'image';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      document: ['application/pdf', 'text/plain', 'application/msword']
    };

    const allowedMimeTypes = allowedTypes[fileType as keyof typeof allowedTypes];
    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedMimeTypes?.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedFilename}`;
    
    // Create upload directory structure
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'transactions', transactionId);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/transactions/${transactionId}/${filename}`;

    // Return file information
    const fileInfo = {
      type: fileType,
      filename: sanitizedFilename,
      url: publicUrl,
      size: file.size,
      uploadedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      file: fileInfo
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get uploaded files for a transaction
export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authorization check to ensure user is part of transaction
    // This would require checking the transaction against the user

    const fs = require('fs').promises;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'transactions', transactionId);
    
    try {
      const files = await fs.readdir(uploadDir);
      const fileInfos = await Promise.all(files.map(async (filename: string) => {
        const filepath = path.join(uploadDir, filename);
        const stats = await fs.stat(filepath);
        
        return {
          filename,
          url: `/uploads/transactions/${transactionId}/${filename}`,
          size: stats.size,
          uploadedAt: stats.mtime,
          type: filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'document'
        };
      }));

      return NextResponse.json({
        success: true,
        files: fileInfos
      });

    } catch (dirError) {
      // Directory doesn't exist, return empty array
      return NextResponse.json({
        success: true,
        files: []
      });
    }

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}