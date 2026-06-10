import { notFound } from "next/navigation";
import { handleGetUser } from "@/lib/actions/auth-action";
import UpdateProfile from "../../../_components/UpdateProfile";

export default async function Profile() {
  const result = await handleGetUser();

  if (!result.success) {
    throw new Error("Error fetching user data");
  }
  if (!result.data) {
    notFound();
  }
  return (
    <div>
      <UpdateProfile initialUser={result.data} />
    </div>
  );
}
