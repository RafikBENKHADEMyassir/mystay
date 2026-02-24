import { redirect } from "next/navigation";

type SpaGymPageProps = {
  params: {
    locale: string;
  };
  searchParams?: {
    tab?: string;
  };
};

export default function SpaGymPage({ params, searchParams }: SpaGymPageProps) {
  const requestedTab = (searchParams?.tab ?? "").trim().toLowerCase();
  const nextRoute = requestedTab === "gym" ? "gym" : "spa";

  redirect(`/${params.locale}/${nextRoute}`);
}
