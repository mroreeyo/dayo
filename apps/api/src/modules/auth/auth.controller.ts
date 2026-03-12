import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { GoogleProfile } from "../../common/auth/google.strategy";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshDto, AuthResponseDto } from "./dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ summary: "Register with email & password" })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @Post("register")
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(dto);
  }

  @ApiOperation({ summary: "Login with email & password" })
  @ApiOkResponse({ type: AuthResponseDto })
  @Post("login")
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({
    schema: { properties: { accessToken: { type: "string" } } },
  })
  @Post("refresh")
  refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string }> {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: "Redirect to Google OAuth consent screen" })
  @UseGuards(AuthGuard("google"))
  @Get("google")
  google(): void {
    return;
  }

  @ApiOperation({ summary: "Google OAuth callback" })
  @ApiOkResponse({ type: AuthResponseDto })
  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  googleCallback(@Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.googleLogin(req.user as GoogleProfile);
  }
}
