import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async editUser(userId: number, dto: EditUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          ...dto
        }
      })
      if (user) {
        delete user.hash;
        return user;
      } else {
        throw new BadRequestException('Unable to update account.')
      }
    } catch (error) {
      throw error
    }
  }
}
