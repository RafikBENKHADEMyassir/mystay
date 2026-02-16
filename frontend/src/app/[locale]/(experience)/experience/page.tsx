import { redirect } from "next/navigation";

type ExperiencePageProps = {
  params: {
    locale: string;
  };
};

export default function ExperiencePage({ params }: ExperiencePageProps) {
  redirect(`/${params.locale}/services`);
}
