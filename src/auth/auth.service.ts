import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException, 
  ConflictException, 
  NotFoundException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProteanService } from './services/protean.service';
import * as bcrypt from 'bcrypt';
import { SignUpDto, SignInDto, VerifyAadhaarDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private proteanService: ProteanService,
  ) {}

  /**
   * Sign up a new user
   */
  async signUp(dto: SignUpDto) {
    this.logger.log(`Sign up attempt for email: ${dto.email}`);

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone },
          { aadharNumber: dto.aadharNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.phone === dto.phone) {
        throw new ConflictException('Phone number already registered');
      }
      if (existingUser.aadharNumber === dto.aadharNumber) {
        throw new ConflictException('Aadhaar number already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
        aadharNumber: dto.aadharNumber,
        role: (dto.role as any) || 'USER',
        maskedAadhaar: this.proteanService.maskAadhaar(dto.aadharNumber),
      },
    });

    this.logger.log(`User created successfully: ${user.userId}`);

    return this.generateTokens(user);
  }

  /**
   * Sign in user
   */
  async signIn(dto: SignInDto) {
    this.logger.log(`Sign in attempt for: ${dto.identifier}`);

    // Find user by email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User signed in successfully: ${user.userId}`);

    return this.generateTokens(user);
  }

  /**
   * Handle DigiLocker OAuth callback and verify Aadhaar
   */
  async handleDigilockerCallback(code: string) {
    try {
      this.logger.log('Processing DigiLocker callback');

      // Get access token from DigiLocker
      const accessToken = await this.proteanService.getAccessToken(code);

      // Fetch Aadhaar data from Protean API
      const aadhaarData = await this.proteanService.getEAadhaarData(accessToken);

      // Extract user data
      const uidData = aadhaarData.Certificate.CertificateData.KycRes.UidData;
      const poi = uidData.Poi;
      const poa = uidData.Poa;

      this.logger.log(`Aadhaar data received for: ${poi.name}`);

      // Find user by Aadhaar number
      let user = await this.prisma.user.findUnique({
        where: { aadharNumber: uidData.uid },
      });

      if (!user) {
        throw new BadRequestException(
          'No account found with this Aadhaar number. Please sign up first.',
        );
      }

      // Update user with Aadhaar verification data
      user = await this.prisma.user.update({
        where: { userId: user.userId },
        data: {
          aadhaarVerified: true,
          aadhaarData: aadhaarData as any,
          photo: uidData.Pht,
          fullName: poi.name,
          dateOfBirth: this.proteanService.parseAadhaarDate(poi.dob),
          gender: poi.gender,
          address: {
            co: poa.co,
            house: poa.house,
            street: poa.street,
            landmark: poa.lm,
            locality: poa.loc,
            vtc: poa.vtc,
            dist: poa.dist,
            state: poa.state,
            country: poa.country,
            pincode: poa.pc?.toString(),
          },
        },
      });

      this.logger.log(`Aadhaar verified successfully for user: ${user.userId}`);

      return {
        verified: true,
        message: 'Aadhaar verified successfully',
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      this.logger.error('DigiLocker callback error:', error);
      throw new BadRequestException(
        error.message || 'Failed to verify Aadhaar with DigiLocker',
      );
    }
  }

  /**
   * Verify Aadhaar using direct access token
   */
  async verifyAadhaarWithToken(userId: string, dto: VerifyAadhaarDto) {
    try {
      this.logger.log(`Manual Aadhaar verification for user: ${userId}`);

      // Fetch Aadhaar data
      const aadhaarData = await this.proteanService.verifyAadhaarWithToken(dto.accessToken);

      const uidData = aadhaarData.Certificate.CertificateData.KycRes.UidData;
      const poi = uidData.Poi;
      const poa = uidData.Poa;

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify Aadhaar matches
      if (user.aadharNumber !== uidData.uid) {
        throw new BadRequestException(
          'Aadhaar number does not match the registered number',
        );
      }

      // Update user with verification data
      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: {
          aadhaarVerified: true,
          aadhaarData: aadhaarData as any,
          photo: uidData.Pht,
          fullName: poi.name,
          dateOfBirth: this.proteanService.parseAadhaarDate(poi.dob),
          gender: poi.gender,
          address: {
            co: poa.co,
            house: poa.house,
            street: poa.street,
            landmark: poa.lm,
            locality: poa.loc,
            vtc: poa.vtc,
            dist: poa.dist,
            state: poa.state,
            country: poa.country,
            pincode: poa.pc?.toString(),
          },
        },
      });

      this.logger.log(`Aadhaar verified successfully for user: ${userId}`);

      return {
        verified: true,
        message: 'Aadhaar verified successfully',
        user: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      this.logger.error('Aadhaar verification error:', error);
      throw new BadRequestException(
        error.message || 'Failed to verify Aadhaar',
      );
    }
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { userId: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify hashed refresh token
      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      this.logger.log(`Tokens refreshed for user: ${user.userId}`);

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { userId },
      data: { refreshToken: null },
    });

    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: any) {
    const payload = {
      sub: user.userId,
      email: user.email,
      phone: user.phone,
      role: user.role,
      aadhaarVerified: user.aadhaarVerified,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.refreshExpiration'),
    });

    // Hash and store refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { password, refreshToken, aadhaarData, ...sanitized } = user;
    return sanitized;
  }
}