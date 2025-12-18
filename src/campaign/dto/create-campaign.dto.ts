import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TargetedLocationDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  radius?: number;
}

export class CreateCampaignDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsArray()
  mediaFiles: Express.Multer.File[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TargetedLocationDto)
  targetedLocation: TargetedLocationDto;

  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  budget: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}