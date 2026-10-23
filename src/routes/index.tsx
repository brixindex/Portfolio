import { createFileRoute } from "@tanstack/react-router";
import { HelioApp } from "@/components/helio-app";
import { PortfolioProvider } from "@/components/portfolio-context";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <PortfolioProvider>
      <HelioApp />
    </PortfolioProvider>
  );
}
