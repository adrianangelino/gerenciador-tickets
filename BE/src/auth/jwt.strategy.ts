import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private redisClient: RedisClientType;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be set in .env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });

    this.redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }) as RedisClientType;

    this.redisClient.connect();
  }

  async validate(payload: {
    sub: number;
    email: string;
    role: string;
  }): Promise<{ id: number; email: string; role: string }> {
    const stored = await this.redisClient.get(`user:${payload.sub}`);
    if (!stored) {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
