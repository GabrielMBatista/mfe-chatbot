import dynamic from "next/dynamic";

const BotConfig = dynamic(() => import("@/components/BotConfig"), {
  ssr: false,
});

export default function Page() {
  return <BotConfig />;
}
