import { ApiProperty } from '@nestjs/swagger';

export class CampaignResponseDto {
  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ description: 'Campaign description', type: String })
  description: string;

  @ApiProperty({
    description: 'Media URLs',
    type: 'array',
    example: [{ type: 'image', url: '...', publicId: '...' }],
  })
  mediaUrls: any[];

  @ApiProperty({
    description: 'Targeted location',
    example: { country: 'USA', state: 'CA', city: 'San Francisco', radius: 50 },
  })
  targetedLocation: any;

  @ApiProperty({ required: false })
  targetedAgeMin?: number;

  @ApiProperty({ required: false })
  targetedAgeMax?: number;

  @ApiProperty()
  budget: number;

  @ApiProperty()
  currentSpending: number;

  @ApiProperty()
  remainingSpending: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  status: string;

  // Engagement metrics
  @ApiProperty()
  likeCount: number;
  @ApiProperty()
  dislikeCount: number;
  @ApiProperty()
  loveCount: number;
  @ApiProperty()
  commentCount: number;
  @ApiProperty()
  shareCount: number;
  @ApiProperty()
  saveCount: number;
  @ApiProperty()
  impressionCount: number;
  @ApiProperty()
  clickCount: number;
  @ApiProperty()
  ctr: number;
  @ApiProperty()
  conversionCount: number;

  // Payment info
  @ApiProperty({ required: false })
  paymentId?: string;
  @ApiProperty({ required: false })
  razorpayOrderId?: string;
  @ApiProperty({ required: false })
  razorpayPaymentId?: string;
  @ApiProperty({ required: false })
  razorpaySignature?: string;
  @ApiProperty()
  paymentStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
