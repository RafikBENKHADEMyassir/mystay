import { redirect } from "next/navigation";

type GymPageProps = {
  params: {
    locale: string;
  };
};

export default function GymPage({ params }: GymPageProps) {
  redirect(`/${params.locale}/spa-gym?tab=gym`);
}
