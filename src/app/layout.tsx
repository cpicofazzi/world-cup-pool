import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationTabs } from "@/components/NavigationTabs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grand Pool '26",
  description: "The ultimate 2026 World Cup Bracket platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        
        {/* Global Header matching playful-tarsier */}
        <header className="bg-brand-navy border-b border-brand-green/20 relative overflow-hidden">
          {/* Decorative background elements to match the golf aesthetic but for World Cup */}
          <div className="absolute top-0 right-0 w-[600px] h-full opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full border border-white/50"></div>
            <div className="absolute top-[-20%] right-[-5%] w-[500px] h-[500px] rounded-full border border-white/30"></div>
            <div className="absolute top-[10%] right-[0%] w-[600px] h-[600px] rounded-full border border-white/10"></div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 flex justify-between items-start">
            <div>
              <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">FIFA WORLD CUP • 2026</p>
              <h1 className="text-4xl md:text-5xl font-black text-brand-gold italic tracking-tight font-serif drop-shadow-md">
                The Grand <span className="text-slate-300 font-light">Pool</span>
              </h1>
              
              <div className="mt-6 flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 text-white text-xs px-3 py-1.5 rounded-full font-mono flex items-center space-x-2">
                   <span>ENTRIES OPEN</span>
                </div>
                <div className="text-brand-green text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse inline-block"></span>
                  <span>LIVE</span>
                </div>
              </div>
            </div>
            
            <div className="text-right hidden sm:block">
               <p className="text-slate-400 text-xs font-mono mb-2">Created by Admin</p>
               <button className="text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 px-4 py-1.5 rounded text-xs transition-colors backdrop-blur-sm bg-white/5 flex items-center justify-center space-x-2 ml-auto">
                 <span>✉</span>
                 <span>Contact</span>
               </button>
            </div>
          </div>
        </header>

        <NavigationTabs />

        <main className="flex-grow pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
