import { api } from './client';
import { LoginDto, RegisterDto, AuthResponseDto } from './types';

export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponseDto> => {
    const response = await api.post<AuthResponseDto>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterDto): Promise<AuthResponseDto> => {
    const response = await api.post<AuthResponseDto>('/auth/register', data);
    return response.data;
  },
};
