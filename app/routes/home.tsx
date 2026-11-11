import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Flyttehjelpen – hvor skal du flytte?" },
    { name: "description", content: "Finn ut hva flyttingen innebærer. Start med adressen du flytter fra og til." },
  ];
}

export default function Home() {
  return <Welcome />;
}
