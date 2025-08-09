import dynamic from "next/dynamic";

const BotConfig = dynamic(() => import("@/components/BotConfig"), {
  ssr: false,
});

// adicionar import dinâmico do widget
const GabsIAWidget = dynamic(() => import("@/components/GabsIAWidget"), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <BotConfig />
      {/* posição fixa controlada pelo shell */}
      <GabsIAWidget tourEnabled fixedPosition={{ bottom: 24, right: 24 }} />
    </>
  );
}
