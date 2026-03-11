import { ApiProperty } from "@nestjs/swagger";

export class OkRevisionResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ description: "Sync cursor revision", example: "35000" })
  revision!: string;
}
