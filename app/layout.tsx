import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quản Lý Học Sinh - Wonder Center",
  description: "Hệ thống quản lý học sinh và điểm danh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

