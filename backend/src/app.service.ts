import { Injectable } from "@nestjs/common";

// delete-this comment

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello c!";
  }
}
