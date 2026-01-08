import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHome(@Res() res: Response) {
    // Use process.cwd() to get project root, not __dirname
    const filePath = join(process.cwd(), 'public', 'index.html');
    return res.sendFile(filePath);
  }
}