import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ProteanService } from './services/protean.service';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  DigilockerCallbackDto,
  VerifyAadhaarDto,
  AuthResponseDto,
  MessageResponseDto,
  UserResponseDto,
  AadhaarVerificationResponseDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private proteanService: ProteanService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: `
Register a new user account with email, phone, and Aadhaar number.

**Steps:**
1. Provide user details including 12-digit Aadhaar number
2. Password will be securely hashed using bcrypt
3. User account will be created but Aadhaar remains unverified
4. Complete Aadhaar verification later using DigiLocker

**Note:** You must verify your Aadhaar via DigiLocker to access full features.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered with JWT tokens',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email, phone, or Aadhaar already registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in to account',
    description: `
Authenticate user with email/phone and password.

**Identifier can be:**
- Email address (e.g., john.doe@example.com)
- Phone number (e.g., 9876543210)

Returns JWT access token (15 min) and refresh token (7 days).
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with JWT tokens',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async signIn(@Body() dto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: `
Get a new access token using a valid refresh token.

**Use this endpoint when:**
- Your access token has expired (after 15 minutes)
- You receive a 401 Unauthorized error
- You want to maintain user session without re-login

The old refresh token will be invalidated and a new one issued.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'New JWT tokens generated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: `
Logout current user by revoking their refresh token.

After logout:
- Refresh token becomes invalid
- Access token remains valid until expiration (max 15 min)
- User must sign in again to get new tokens
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async logout(@GetUser('userId') userId: string): Promise<MessageResponseDto> {
    return this.authService.logout(userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: `
Retrieve detailed profile information of the authenticated user.

**Includes:**
- Personal information (name, email, phone)
- Aadhaar verification status
- Address details (if verified)
- Profile photo (if verified)
- Account timestamps
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(
    @GetUser('userId') userId: string,
  ): Promise<UserResponseDto> {
    return this.authService.getUserProfile(userId);
  }

  @Public()
  @Get('digilocker/authorize')
  @ApiOperation({
    summary: 'Initiate DigiLocker Aadhaar verification',
    description: `
Redirect user to DigiLocker for OAuth-based Aadhaar verification.

**Flow:**
1. User is redirected to DigiLocker login page
2. User authenticates with DigiLocker credentials
3. User authorizes access to e-Aadhaar document
4. DigiLocker redirects back to callback URL with authorization code
5. System exchanges code for Aadhaar data via Protean API
6. User's Aadhaar is verified and profile updated

**Prerequisites:**
- User must be signed up with their Aadhaar number first
- This endpoint works in browser only (redirect-based)
    `,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Optional CSRF protection state parameter',
    example: 'random_state_string',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to DigiLocker authorization page',
  })
  initiateDigilockerAuth(@Query('state') state: string, @Res() res: Response) {
    const authUrl = this.proteanService.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  }

  @Public()
  @Get('digilocker/callback')
  @ApiOperation({
    summary: 'DigiLocker OAuth callback handler',
    description: `
Handle callback from DigiLocker after user authorization.

**This endpoint is called automatically by DigiLocker** after successful authorization.

**Process:**
1. Receives authorization code from DigiLocker
2. Exchanges code for access token via Protean API
3. Fetches complete e-Aadhaar XML data
4. Extracts user information (name, DOB, gender, address, photo)
5. Updates user record with verified Aadhaar data
6. Redirects to frontend with success/error status

**Data Retrieved:**
- Full name
- Date of birth
- Gender
- Complete address (house, street, locality, district, state, pincode)
- Photo (Base64 encoded)
- Aadhaar number (masked)
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with verification status',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to authenticate with DigiLocker or fetch Aadhaar data',
  })
  async digilockerCallback(
    @Query() query: DigilockerCallbackDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.handleDigilockerCallback(
        query.code,
      );

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = `${frontendUrl}/auth/aadhaar-success?verified=${result.verified}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorMessage = encodeURIComponent(error.message);
      return res.redirect(
        `${frontendUrl}/auth/aadhaar-error?error=${errorMessage}`,
      );
    }
  }

  @Post('aadhaar/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Aadhaar with access token (Direct API)',
    description: `
Verify Aadhaar using DigiLocker access token obtained externally.

**Use this endpoint when:**
- You already have a DigiLocker access token
- You're implementing custom OAuth flow
- You're testing with pre-obtained tokens

**Standard flow uses:** \`GET /auth/digilocker/authorize\` instead.

**Process:**
1. Provide DigiLocker access token
2. System fetches e-Aadhaar data from Protean API
3. Validates Aadhaar matches registered number
4. Updates user profile with verified data
5. Returns updated user information

**Data Retrieved:**
- Full name, DOB, gender
- Complete address
- Photo
- Aadhaar verification status
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Aadhaar verified successfully',
    type: AadhaarVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid access token or Aadhaar mismatch',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async verifyAadhaarWithToken(
    @GetUser('userId') userId: string,
    @Body() dto: VerifyAadhaarDto,
  ): Promise<AadhaarVerificationResponseDto> {
    return this.authService.verifyAadhaarWithToken(userId, dto);
  }
}
