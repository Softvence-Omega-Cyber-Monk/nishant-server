import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private razorpay: any;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createOrder(options: {
    amount: number;
    currency: string;
    receipt: string;
  }): Promise<any> {
    return this.razorpay.orders.create(options);
  }

  async fetchPayment(paymentId: string): Promise<any> {
    return this.razorpay.payments.fetch(paymentId);
  }

  async capturePayment(paymentId: string, amount: number): Promise<any> {
    return this.razorpay.payments.capture(paymentId, amount);
  }

  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    return this.razorpay.payments.refund(paymentId, { amount });
  }
}