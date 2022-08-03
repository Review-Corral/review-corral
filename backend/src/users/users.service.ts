import { Injectable } from "@nestjs/common";
import { Prisma, users } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByid(id: string): Promise<Prisma.Prisma__usersClient<users>> {
    return await this.prisma.users.findUnique({
      where: { id },
    });
  }
}
