import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import { create } from "domain";

export default function RootLayout({
  children,
  team,
  analytics,
}: Readonly<{
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="leo1"
          strategy="beforeInteractive"
          src="https://unpkg.com/vue@3/dist/vue.global.js"
        ></Script>
      </head>
      <body>
        {children}
        {/* {team}
        {analytics} */}
        {/* <Link href="/setting">Setting</Link> */}
        <div id="app"></div>
        <Script id="leo2" strategy="afterInteractive">
          {`
            const {createApp} = Vue;
            createApp({
             template: '<h1>Hello from {{message}}</h1>',
             setup() {
               // Composition API logic can go here
               return {
                 message: 'next + Vue 3!'
               };
             }
            
            }).mount('#app');
            
            `}
        </Script>
      </body>
    </html>
  );
}
