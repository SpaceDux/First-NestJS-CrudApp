import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {

  }

  async getBookmarks(userId: number) {
    try {
      const query = await this.prisma.bookmark.findMany({
        where: {
          userId
        }
      })

      if (query) {
        return query;
      } else {
        throw new BadRequestException("Unable to retrieve your bookmarks.");
      }

    } catch (error) {
      throw error;
    }
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    try {
      const query = await this.prisma.bookmark.findFirst({
        where: {
          id: bookmarkId,
          userId
        }
      })
      if (query) {
        return query;
      } else {
        throw new NotFoundException("Unable to find.")
      }
    } catch (error) {
      throw error;
    }
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    try {
      const query = await this.prisma.bookmark.create({
        data: {
          userId: userId,
          ...dto,
        },
      })

      if (query) {
        return query
      } else {
        throw new BadRequestException("Unable to create bookmark.")
      }
    } catch (error) {
      throw error;
    }
  }

  async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
    try {
      const bookmark = await this.prisma.bookmark.findUnique({
        where: {
          id: bookmarkId
        }
      })
      if (!bookmark && bookmark.userId !== userId) {
        throw new ForbiddenException("Sorry, you are unable to modify this bookmark.")
      }

      const query = await this.prisma.bookmark.update({
        data: {
          ...dto
        },
        where: {
          id: bookmarkId
        }
      })
      return query;
    } catch (error) {
      throw error;
    }
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    try {
      const bookmark = await this.prisma.bookmark.findUnique({
        where: {
          id: bookmarkId
        }
      })
      if (!bookmark && bookmark.userId !== userId) {
        throw new ForbiddenException("Sorry, you are unable to modify this bookmark.")
      }

      await this.prisma.bookmark.delete({
        where: {
          id: bookmarkId
        }
      })
    } catch (error) {
      throw error;
    }
  }
}
