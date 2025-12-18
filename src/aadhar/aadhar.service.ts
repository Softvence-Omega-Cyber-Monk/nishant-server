import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class AadhaarService {
  private baseUrl: string;
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('PROTEAN_BASE_URL')!;
    this.apiKey = this.configService.get('PROTEAN_API_KEY')!;
    this.clientId = this.configService.get('PROTEAN_CLIENT_ID')!;
    this.clientSecret = this.configService.get('PROTEAN_CLIENT_SECRET')!;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      // Some endpoints may require Basic Auth or Bearer – adjust per docs
      // Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
    };
  }

  // Step 1: Request OTP
  async requestOtp(aadhaarNumber: string, transactionId?: string) {
    const payload = {
      aadhaar_number: aadhaarNumber,
      consent: 'Y',  // User consent mandatory
      txn_id: transactionId || `TXN_${Date.now()}`,  // Unique txn ID
      // Additional params like purpose, etc., as per Protean docs
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}${this.configService.get('PROTEAN_AADHAAR_OTP_REQUEST')}`,
          payload,
          { headers: this.getHeaders() },
        ),
      );

      if (response.data.success || response.data.status === 'Y') {
        return {
          success: true,
          txnId: payload.txn_id,
          message: 'OTP sent successfully',
          refId: response.data.ref_id,  // Often returned
        };
      }
      throw new Error(response.data.message || 'OTP request failed');
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to request OTP',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Step 2: Submit OTP & Get Verified Data
  async submitOtp(txnId: string, otp: string) {
    const payload = {
      txn_id: txnId,
      otp: otp,
      // Some APIs require encrypted OTP or additional fields
      // If needed: otp: CryptoJS.AES.encrypt(otp, this.clientSecret).toString(),
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}${this.configService.get('PROTEAN_AADHAAR_OTP_SUBMIT')}`,
          payload,
          { headers: this.getHeaders() },
        ),
      );

      if (response.data.success || response.data.ret === 'Y') {
        const data = response.data.data || response.data.KycRes || response.data;

        return {
          success: true,
          verifiedData: {
            name: data.name || data.Poi?.name,
            dob: data.dob || data.Poi?.dob,
            gender: data.gender || data.Poi?.gender,
            address: data.address || {
              co: data.Poa?.co,
              house: data.Poa?.house,
              street: data.Poa?.street,
              loc: data.Poa?.loc,
              vtc: data.Poa?.vtc,
              dist: data.Poa?.dist,
              state: data.Poa?.state,
              pc: data.Poa?.pc,
              country: data.Poa?.country,
            },
            maskedAadhaar: data.masked_aadhaar || data.uid,
            photo: data.photo || data.Pht,  // Base64
            transactionId: txnId,
          },
        };
      }
      throw new Error(response.data.message || 'Verification failed');
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'OTP verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Optional: Verify against user-provided data
  verifyDetails(fetched: any, userInput: any) {
    // Implement fuzzy/exact match logic
    return {
      nameMatch: fetched.name.toLowerCase() === userInput.name.toLowerCase(),
      dobMatch: fetched.dob === userInput.dob,
      // Add more as needed
    };
  }
}