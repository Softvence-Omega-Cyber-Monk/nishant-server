import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class PaymentVerificationDto {
  @ApiProperty({ 
    description: 'Razorpay order ID',
    example: 'order_MNqwerty1234567'
  })
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ 
    description: 'Razorpay payment ID',
    example: 'pay_MNqwerty7654321'
  })
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ 
    description: 'Razorpay signature for verification',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
  })
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @ApiProperty({ 
    description: 'Campaign ID to activate after payment',
    example: 'campaign_abc123xyz'
  })
  @IsNotEmpty()
  @IsString()
  campaignId: string;
}