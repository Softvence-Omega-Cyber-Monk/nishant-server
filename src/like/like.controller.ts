import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Reactions')
@Controller('reactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post(':campaignId/like')
  @Roles('USER', 'VENDOR')
  @ApiOperation({
    summary: 'Like or unlike a campaign',
    description:
      'Allows a user to like a campaign. If the campaign is already liked by the user, the like will be removed.',
  })
  async toggleLike(
    @Param('campaignId') campaignId: string,
    @GetUser() user: { userId: string },
  ) {
    return this.likeService.toggleLike(campaignId, user.userId);
  }
  @Post(':campaignId/dislike')
  @Roles('USER', 'VENDOR')
  @ApiOperation({
    summary: 'DisLike or unDisLike a campaign',
    description:
      'Allows a user to disLike a campaign. If the campaign is already liked by the user, the like will be removed.',
  })
  async toggleDisLike(
    @Param('campaignId') campaignId: string,
    @GetUser() user: { userId: string },
  ) {
    return this.likeService.toggleDisLike(campaignId, user.userId);
  }

  @Post(':campaignId/love')
  @Roles('USER', 'VENDOR')
  @ApiOperation({
    summary: 'Love or Hate a campaign',
    description:
      'Allows a user to love a campaign. If the campaign is already loved by the user, the like will be removed.',
  })
  async toggleLove(
    @Param('campaignId') campaignId: string,
    @GetUser() user: { userId: string },
  ) {
    return this.likeService.toggleLove(campaignId, user.userId);
  }
}
