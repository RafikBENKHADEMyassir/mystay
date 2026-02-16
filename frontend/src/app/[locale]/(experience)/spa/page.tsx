import { redirect } from "next/navigation";

type SpaPageProps = {
  params: {
    locale: string;
  };
};

export default function SpaPage({ params }: SpaPageProps) {
  redirect(`/${params.locale}/spa-gym?tab=spa`);
}
