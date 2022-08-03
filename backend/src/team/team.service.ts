import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async getTeam(query: any) {
    // return this.prisma.team.findOne({
    //   where: {
    //     id: query.id,
    //   },
    // });
  }
}
