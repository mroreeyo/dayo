import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxx]' })
  @IsString()
  token!: string;

  @ApiProperty({ enum: ['ios', 'android'], example: 'ios' })
  @IsString()
  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}

export class DeviceTokenResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'ExponentPushToken[xxx]' })
  token!: string;

  @ApiProperty({ enum: ['ios', 'android'], example: 'ios' })
  platform!: string;

  @ApiProperty()
  createdAt!: string;
}
