import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Feed Comments')
@Controller('comment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':campaignId')
  @Roles('USER', 'VENDOR')
  @ApiOperation({
    summary: 'Add comment or reply to a campaign',
    description:
      'Creates a top-level comment or a single-level reply on a campaign. Nested replies beyond one level are not allowed.',
  })
  async addComment(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.addComment(campaignId, userId, dto);
  }
  @Get(':campaignId')
  @ApiOperation({
    summary: 'Get campaign comments',
    description:
      'Fetches all top-level comments with one-level replies for a campaign.',
  })
  async getComments(@Param('campaignId') campaignId: string) {
    return this.commentService.getComments(campaignId);
  }
}
