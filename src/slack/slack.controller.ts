import { Body, Controller, Post } from "@nestjs/common";

@Controller("/slack")
export class SlackController {
  @Post()
  postGithubEvents(@Body() body: any) {
    console.log(body);
  }
}
