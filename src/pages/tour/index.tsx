import dynamic from "next/dynamic";

const Tour = dynamic(() => import("@/components/TourDemo"), {
  ssr: false,
});

export default function Page() {
  return <Tour />;
}
