import dynamic from "next/dynamic";

const BotConfig = dynamic(() => import("@/components/BotConfig"), {
  ssr: false,
});
const GabsIAWidget = dynamic(() => import("@/components/GabsIAWidget"), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <BotConfig />
      <GabsIAWidget tourEnabled fixedPosition={{ bottom: 24, right: 24 }} />
    </>
  );
}
