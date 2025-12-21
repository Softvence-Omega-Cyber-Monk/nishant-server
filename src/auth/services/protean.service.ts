import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface AadhaarKycData {
  Certificate: {
    CertificateData: {
      KycRes: {
        code: string;
        ret: string;
        ts: string;
        ttl: string;
        txn: string;
        UidData: {
          tkn: string;
          uid: string;
          Poi: {
            dob: string;
            gender: string;
            name: string;
          };
          Poa: {
            co?: string;
            country: string;
            dist: string;
            house?: string;
            lm?: string;
            loc?: string;
            pc: number;
            state: string;
            street?: string;
            vtc: string;
          };
          LData?: any;
          Pht?: string;
        };
      };
    };
  };
}

@Injectable()
export class ProteanService {
  private readonly logger = new Logger(ProteanService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly authorizationUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('protean.apiKey')!;
    this.baseUrl = this.configService.get<string>('protean.baseUrl')!;
    this.authorizationUrl = this.configService.get<string>(
      'protean.authorizationUrl',
    )!;
    this.clientId = this.configService.get<string>('protean.clientId')!;
    this.redirectUri = this.configService.get<string>('protean.redirectUri')!;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      timeout: 30000,
    });
  }

  /**
   * Generate DigiLocker authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state || this.generateRandomState(),
    });

    const url = `${this.authorizationUrl}?${params.toString()}`;
    this.logger.log(`Generated authorization URL: ${url}`);
    return url;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      // Note: Adjust this based on actual Protean OAuth implementation
      const response = await this.axiosInstance.post('/oauth/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
      });

      this.logger.log('Access token obtained successfully');
      return response.data.access_token;
    } catch (error) {
      this.logger.error(
        'Failed to get access token:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to get access token from DigiLocker',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Fetch e-Aadhaar data from DigiLocker using Protean API
   */
  async getEAadhaarData(accessToken: string): Promise<AadhaarKycData> {
    try {
      this.logger.log('Fetching e-Aadhaar data from Protean API');

      const response = await this.axiosInstance.post(
        '/digilocker/xml/eaadhaar',
        {
          access_token: accessToken,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log('e-Aadhaar data fetched successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        'Protean API Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message ||
          'Failed to fetch Aadhaar data from DigiLocker',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Verify Aadhaar using direct access token
   */
  async verifyAadhaarWithToken(accessToken: string): Promise<AadhaarKycData> {
    return this.getEAadhaarData(accessToken);
  }

  /**
   * Mask Aadhaar number for display
   */
  maskAadhaar(aadhaarNumber: string): string {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return aadhaarNumber;
    }
    return `XXXX XXXX ${aadhaarNumber.slice(-4)}`;
  }

  /**
   * Parse date from DD-MM-YYYY format
   */
  parseAadhaarDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}`);
  }

  private generateRandomState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
