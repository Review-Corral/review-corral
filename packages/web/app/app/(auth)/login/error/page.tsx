"use client";
import { FC } from "react";

const Page: FC = () => {
  console.error("On the auth error page");

  return (
    <div>
      <p>Oops... there was an error logging you in. </p>
      <a href="https://www.reviewcorral.com">home</a>
    </div>
  );
};

export default Page;
