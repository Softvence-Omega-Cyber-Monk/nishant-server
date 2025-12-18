import { IsNotEmpty, IsString } from "class-validator";

export class PaymentVerificationDto {
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @IsNotEmpty()
  @IsString()
  campaignId: string;
}
