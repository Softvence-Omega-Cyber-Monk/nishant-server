import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 19.0760, description: 'Current latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 72.8777, description: 'Current longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}