"use client";

import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import StoreProvider from "../StoreProvider";

const AppWithoutSSR = dynamic(() => import("../App"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    return (
        <main className={`${styles.main} ${inter.className}`}>
            <StoreProvider>
                <AppWithoutSSR />
            </StoreProvider>
        </main>
    );
}
