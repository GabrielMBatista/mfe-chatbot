import { NextPage, NextPageContext } from "next";
import dynamic from "next/dynamic";

const ErrorClient = dynamic(() => import("@/components/ErrorClient"), {
  ssr: false,
  loading: () => <p>Carregando erro...</p>,
});

interface ErrorPageProps {
  statusCode?: number;
  message?: string;
}

const ErrorPage: NextPage<ErrorPageProps> = ({ statusCode, message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <ErrorClient statusCode={statusCode} message={message} />
    </div>
  );
};

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode || err?.statusCode || 500;
  const message = err?.message || "Ocorreu um erro inesperado.";
  return { statusCode, message };
};

export default ErrorPage;
