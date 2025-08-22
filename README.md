# MFE Chatbot

This project is a micro frontend built with **Next.js** and **TypeScript** that exposes a chatbot widget. It includes UI components, hooks and API routes that can be federated into other applications.

## Getting started

```bash
npm install
npm run dev   # start development server
npm run build # create production build
npm start     # run built app
```

## Usage

After running the application, the micro frontend exposes its widgets via
Module Federation. A host application can consume them by declaring the remote
and dynamically importing the component.

**next.config.js of the host**

```js
new NextFederationPlugin({
  remotes: {
    Chatbot: 'Chatbot@http://localhost:3001/_next/static/chunks/remoteEntry.js',
  },
});
```

**Embedding the widget in a page**

```tsx
import dynamic from 'next/dynamic';

const GabsIAWidget = dynamic(() => import('Chatbot/GabsIAWidget'), { ssr: false });

export default function Page() {
  return (
    <GabsIAWidget
      initialMessage={{ question: 'Olá', answer: 'Oi!', owner: 'gone' }}
      fixedPosition="bottom-right"
    />
  );
}
```

To start the guided tour programmatically, import and call `startGabsTour` from
the widget:

```ts
import { startGabsTour } from 'Chatbot/GabsIAWidget';

startGabsTour();
```

## Project structure

- **src/** – main application source code
  - **components/** – reusable React components and UI primitives
  - **hooks/** – custom React hooks used throughout the project
  - **lib/** – helper libraries such as OpenAI and Prisma clients
  - **pages/** – Next.js pages and API routes for the chatbot and tour
  - **styles/** – global styles and design tokens
  - **types/** – TypeScript declaration files
  - **utils/** – utility helpers
- **prisma/** – database schema and migrations
- **public/** – static assets like Lottie animations and icons
- **tailwind.config.ts** – Tailwind CSS configuration

## License

This repository is licensed under the [MIT License](LICENSE).
