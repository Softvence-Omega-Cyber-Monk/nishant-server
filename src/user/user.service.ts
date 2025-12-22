import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import NodeGeocoder from 'node-geocoder';

@Injectable()
export class UserService {
    private readonly geocoder: NodeGeocoder.Geocoder;
      constructor(
        private prisma: PrismaService,
            private cloudinary: CloudinaryService,
      ) {
        this.geocoder = NodeGeocoder({
              provider: 'openstreetmap', 
            });
      }

async updateUserLocation(userId: string, latitude: number, longitude: number) {
  await this.prisma.user.update({
    where: { userId },
    data: {
      latitude,
      longitude,
    },
  });
}
async updateProfile(
  userId: string,
  dto: UpdateProfileDto,
  file?: Express.Multer.File,
) {
  const updateData: any = {};

  // Basic field updates
  if (dto.fullName !== undefined) updateData.fullName = dto.fullName?.trim();
  if (dto.description !== undefined) updateData.description = dto.description?.trim();
  if (dto.gender !== undefined) updateData.gender = dto.gender;

  // Location handling + geocoding
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;

  if (dto.location !== undefined) {
    const trimmedLocation = dto.location?.trim();
    updateData.location = trimmedLocation || null;

    if (trimmedLocation) {
      const res = await this.geocoder.geocode(trimmedLocation);
      if (res.length === 0) {
        throw new BadRequestException('Unable to geocode the provided location.');
      }
      latitude = res[0].latitude;
      longitude = res[0].longitude;
    }
  }

  // Profile image upload
  if (file) {
    // Delete old photo if exists
    const currentUser = await this.prisma.user.findUnique({
      where: { userId },
      select: { photo: true },
    });

    if (currentUser?.photo) {
      const publicId = currentUser.photo.split('/').pop()?.split('.')[0];
      if (publicId) {
        await this.cloudinary.deleteFile(publicId);
      }
    }

    const result = await this.cloudinary.uploadFile(file);
    updateData.photo = result.secure_url;
  }

  // Update coordinates if geocoded
  if (latitude !== undefined && longitude !== undefined) {
    updateData.latitude = latitude ?? null;
    updateData.longitude = longitude ?? null;
  }

  // === PROFILE COMPLETION BONUS LOGIC ===
  const currentUser = await this.prisma.user.findUnique({
    where: { userId },
    select: {
      description: true,
      gender: true,
      location: true,
      photo: true,
      profileCompleted: true,
    },
  });

  if (!currentUser) {
    throw new NotFoundException('User not found');
  }

  // Was the profile incomplete before this update?
  const wasIncomplete =
    !currentUser.profileCompleted &&
    (!currentUser.description ||
      !currentUser.gender ||
      !currentUser.location ||
      !currentUser.photo);

  // Will the profile be complete after this update?
  const willHaveDescription = dto.description?.trim() ?? currentUser.description;
  const willHaveGender = dto.gender ?? currentUser.gender;
  const willHaveLocation = dto.location?.trim() ?? currentUser.location;
  const willHavePhoto = file ? true : !!currentUser.photo;

  const willBeComplete =
    !!willHaveDescription &&
    !!willHaveGender &&
    !!willHaveLocation &&
    !!willHavePhoto;

  let pointsEarned = 0;

  if (wasIncomplete && willBeComplete) {
    updateData.pointsBalance = { increment: 50 };
    updateData.profileCompleted = true;
    pointsEarned = 50;
  }
  // === END BONUS LOGIC ===

  // Final update
  const updatedUser = await this.prisma.user.update({
    where: { userId },
    data: updateData,
    select: {
      userId: true,
      fullName: true,
      photo: true,
      description: true,
      gender: true,
      location: true,
      latitude: true,
      longitude: true,
      pointsBalance: true,
      profileCompleted: true,
    },
  });

  return {
    message: 'Profile updated successfully',
    pointsEarned,
    user: updatedUser,
  };
}
}
