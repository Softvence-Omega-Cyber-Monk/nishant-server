import {
  Controller,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateLocationDto } from './dto/update-location.dto';

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
}