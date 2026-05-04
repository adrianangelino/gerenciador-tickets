import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient, RedisClientType } from 'redis';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

export interface LoginResponse {
  access_token: string;
  user: { id: number; name: string; email: string; role: string };
}

@Injectable()
export class AuthService {
  private redisClient: RedisClientType;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {
    this.redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }) as RedisClientType;

    this.redisClient.connect();
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const ttl = Number(process.env.JWT_TTL) || 3600;
    await this.redisClient.set(`user:${user.id}`, token, { EX: ttl });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(userId: number): Promise<void> {
    await this.redisClient.del(`user:${userId}`);
  }
}
