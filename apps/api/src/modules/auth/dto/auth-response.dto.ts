import { ApiProperty } from "@nestjs/swagger";

export class AuthTokensDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIs..." })
  accessToken!: string;

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIs..." })
  refreshToken!: string;
}

export class UserProfileDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "Alice" })
  nickname!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
