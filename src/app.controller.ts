import { Body, Controller, Get, Post } from '@nestjs/common';
import { GithubActions, GithubEvent } from 'types/github';
import { AppService } from './app.service';

const pullRequests = [];
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/events')
  postGithubEvents(@Body() body: GithubEvent) {
    console.log(`Got action of ${body.action}`);

    if (GithubActions.includes(body.action)) {
      console.log(`Got action of ${body.action}`);
    }

    console.log(JSON.stringify(body, null, 2));
  }
}
