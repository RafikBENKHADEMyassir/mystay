import { redirect } from "next/navigation";

export default async function PropertySetupIndexPage({
  params
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  redirect(`/platform/hotels/${encodeURIComponent(hotelId)}/setup/sync`);
}

