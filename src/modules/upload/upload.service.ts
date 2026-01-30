import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { UploadResponseDto } from './dto';

@Injectable()
export class UploadService {
  private readonly uploadDestination: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDestination =
      this.configService.get<string>('UPLOAD_DESTINATION') || './uploads';
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories(): void {
    const directories = ['avatars', 'products', 'categories', 'general'];
    directories.forEach((dir) => {
      const fullPath = path.join(this.uploadDestination, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  processUploadedFile(
    file: Express.Multer.File,
    category: string,
  ): UploadResponseDto {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const relativePath = `${category}/${file.filename}`;

    return {
      originalName: file.originalname,
      filename: file.filename,
      path: relativePath,
      url: `/uploads/${relativePath}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(this.uploadDestination, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getUploadDestination(): string {
    return this.uploadDestination;
  }
}
