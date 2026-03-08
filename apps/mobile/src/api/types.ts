export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  nickname: string;
}

export interface AuthResponseDto {
  tokens: AuthTokensDto;
  user: UserProfileDto;
}
