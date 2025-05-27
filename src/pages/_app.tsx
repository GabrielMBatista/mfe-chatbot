import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Providers } from '@/providers/providers';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}
