import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

// We just need to map the pull requests with the slack IDs so we can thread the messages

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
