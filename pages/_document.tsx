import Document, { Head, Html, Main, NextScript } from "next/document";

/* eslint-disable @next/next/no-img-element */
class CustomDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en-US" dir="ltr">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Lato&display=swap"
          />
          <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
/* eslint-enable @next/next/no-img-element */

export default CustomDocument;
