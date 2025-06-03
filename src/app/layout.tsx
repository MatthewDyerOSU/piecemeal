import ClientNavWrapper from "@/components/clientNavWrapper";
import { UserContextProvider } from "@/context/userContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PieceMeal",
  description: "An app to help people choose what to make for dinner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserContextProvider>
          <ClientNavWrapper />
          <main>{children}</main>
        </UserContextProvider>
      </body>
    </html>
  );
}
