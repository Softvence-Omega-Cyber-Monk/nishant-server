import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PaymentVerificationDto {
  @ApiProperty({ 
    example: 'order_JZg8h2E3HGHD6h', 
    description: 'Razorpay order ID from payment response' 
  })
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ 
    example: 'pay_JZg8h2E3HGHD6h', 
    description: 'Razorpay payment ID from payment response' 
  })
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ 
    example: 'generated_signature_hash', 
    description: 'Razorpay signature for verification' 
  })
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @ApiProperty({ 
    example: 'uuid-campaign-id', 
    description: 'Campaign ID to activate after payment' 
  })
  @IsNotEmpty()
  @IsString()
  campaignId: string;
}