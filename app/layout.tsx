import { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import Providers from "./providers";

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <>
            {children} <Toaster position="top-right" />
          </>
        </Providers>
      </body>
    </html>
  );
}
