import ResetPasswordForm from "../_components/ResetPasswordForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const token = query.token ? (query.token as string) : "";
  return (
    <div className="py-4">
      <h1 className="text-black/80 text-3xl font-extrabold text-center  ">
        Reset Password
      </h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}
