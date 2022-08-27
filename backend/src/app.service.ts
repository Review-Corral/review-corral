import { Injectable } from "@nestjs/common";

// delete-this comment

@Injectable()
export class AppService {
  getHello(): string {
    console.log("Hey a");
    return "Hello c!";
  }
}
