import { Controller, Post, Body } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

type UserWithoutPassword = Omit<User, 'password'>;

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<UserWithoutPassword> {
    return this.userService.create(dto);
  }
}
