import { Module } from '@nestjs/common';
import { AadhaarService } from './aadhar.service';
import { AadharController } from './aadhar.controller';

@Module({
  providers: [AadhaarService],
  controllers: [AadharController]
})
export class AadharModule {}
