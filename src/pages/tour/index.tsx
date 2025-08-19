import dynamic from "next/dynamic";

const Tour = dynamic(() => import("@/components/TourDemo"), {
  ssr: false,
});

const GabsIAWidget = dynamic(() => import("@/components/GabsIAWidget"), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <Tour />
      <GabsIAWidget tourEnabled fixedPosition={{ bottom: 24, right: 24 }} />
    </>
  );
}
