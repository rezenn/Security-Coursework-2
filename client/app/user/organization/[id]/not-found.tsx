import Link from "next/link";

export default function OrganizationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Organization Not Found
      </h2>
      <p className="text-gray-600 mb-6">
        The organization you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/user/organizations"
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Browse Organizations
      </Link>
    </div>
  );
}
