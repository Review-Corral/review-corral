import { NestFactory } from "@nestjs/core";
import { App } from "@slack/bolt";
import { AppModule } from "./app.module";

declare const module: any;

console.log(process.env.SLACK_SIGNING_SECRET);

export const slackApp = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(4000);

  (async () => {
    // Start the app
    await slackApp.start(process.env.PORT || 3000);

    console.log("⚡️ Bolt app is running!");
  })();

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
