import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import * as argon from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) { }

  async signin(dto: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email
        }
      })

      if (!user) throw new BadRequestException(`${dto.email} does not exist on our system.`)

      // User found. Lets compare hash.
      if (await argon.verify(user.hash, dto.password)) {
        return this.signToken(user.id, user.email)
      } else {
        // Does not match.
        throw new UnauthorizedException(`That password does not match our records.`);
      }
    } catch (error) {
      throw error;
    }
  }

  async signup(dto: AuthDto) {
    try {
      // Hash password.
      const hash = await argon.hash(dto.password);
      //Insert into DB query.
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash
        },
      })

      return this.signToken(user.id, user.email)

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // Error, duplicate.
        if (error.code == 'P2002') {
          throw new BadRequestException(`${dto.email} already exists on our system.`)
        }
      }
      throw error;
    }
  }

  async signToken(userId: number, email: string): Promise<{ access_token: string }> {

    const payload = {
      sub: userId,
      email
    }

    const secret = this.config.get("JWT_SECRET")

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: secret
    })

    return { access_token: token }
  }
}