import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from './client-providers';
import { Header } from '@/components/layout/Header';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "DAO Lottery - 去中心化抽奖治理平台",
  description: "基于区块链的DAO治理和抽奖系统，集成NFT激励机制",
  keywords: ["DAO", "DeFi", "Lottery", "NFT", "Governance", "Web3"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-white antialiased`}>
        <ClientProviders>
          <Toaster position="top-right" theme="dark" richColors closeButton />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-primary/20 bg-surface/30 backdrop-blur-sm py-8">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-r from-primary to-secondary" />
                    <span className="text-sm text-gray-400">
                      © 2025 DAO Lottery Program Team. All rights reserved.
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <a href="#" className="hover:text-primary transition-colors">文档</a>
                    <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                    <a href="#" className="hover:text-primary transition-colors">Discord</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
