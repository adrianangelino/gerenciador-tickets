import { Injectable, ConflictException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserWithoutPassword> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const { password, ...user } = await this.prisma.user.create({
      data: { ...dto, password: hashed },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
