import {
  Controller,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('me/location')
  @Roles('USER', 'VENDOR')
  @ApiOperation({
    summary: 'Update current location (GPS)',
    description:
      'Allows authenticated users to update their latitude and longitude in real-time using device GPS. Used for location-based campaign feed.',
  })
  @ApiBody({
    type: UpdateLocationDto,
    description: 'Current GPS coordinates',
  })
  
 
  async updateMyLocation(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    await this.userService.updateUserLocation(userId, dto.latitude, dto.longitude);

    return {
      message: 'Location updated successfully',
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
  }
@Patch('me/profile')
@Roles('USER', 'VENDOR')
@UseInterceptors(FileInterceptor('profileImage'))
@ApiConsumes('multipart/form-data')
@ApiOperation({
  summary: 'Update my profile',
  description: 'Update name, bio, gender, location, and profile image. Location will be geocoded automatically.',
})
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      fullName: {
        type: 'string',
        example: 'John Doe',
        description: 'Full name',
      },
      description: {
        type: 'string',
        example: 'A happy soul living in Mumbai',
        description: 'Short bio/description',
      },
      gender: {
        type: 'string',
        enum: ['Male', 'Female', 'Other'],
        example: 'Male',
        description: 'Gender',
      },
      location: {
        type: 'string',
        example: 'Andheri West, Mumbai, Maharashtra, India',
        description: 'Readable location (will be geocoded to latitude/longitude)',
      },
      profileImage: {
        type: 'string',
        format: 'binary',
        description: 'Profile image file (PNG, JPEG, WEBP, GIF)',
      },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'Profile updated successfully',
})
@ApiResponse({ status: 400, description: 'Invalid input' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async updateMyProfile(
  @GetUser('userId') userId: string,
  @Body() dto: UpdateProfileDto,
  @UploadedFile() profileImage?: Express.Multer.File,
) {
  return this.userService.updateProfile(userId, dto, profileImage);
}


}