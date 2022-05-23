import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard) // Using the guard on a top level.
@Controller('users') // Defining the Endpoint
export class UserController {
  constructor(private userService: UserService) {

  }

  @Get('me')
  async getMe(@GetUser() user: User) {
    return user;
  }

  @Patch('edit')
  async editUser(@GetUser('id') userId: number, @Body() body: EditUserDto) {
    return this.userService.editUser(userId, body)
  }

}
