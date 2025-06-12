import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Providers } from "shell/Providers";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}
