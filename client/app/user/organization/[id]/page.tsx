import Image from "next/image";
import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { ClockIcon } from "@heroicons/react/24/outline";
import OrganizationSidebar from "../../_component/OrganizationSidebar";
import { handleGetOrganizationById } from "@/lib/actions/organization/organization-action";
import { notFound } from "next/navigation";
import building from "@/app/assets/images/buildingPlaceholder.jpg";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ returnTo?: string }> | { returnTo?: string };
}

export default async function OrganizationDetail({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await (searchParams || {});
  const returnTo = resolvedSearchParams.returnTo || "/user/organizations";
  const organizationId = resolvedParams.id;

  if (!organizationId) notFound();

  const result = await handleGetOrganizationById(organizationId);
  if (!result.success || !result.data) notFound();

  const organization = result.data;

  const getProfileImageUrl = () => {
    if (organization.user?.profilePicture) {
      if (organization.user.profilePicture.startsWith("http")) {
        return organization.user.profilePicture;
      }
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/profile/${organization.user.profilePicture}`;
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayDay = days[new Date().getDay()];
  const todayHours = organization.workingHours?.find(
    (h: any) => h.day === todayDay,
  );

  const getTodayWorkingHours = () => {
    if (todayHours?.isWorking) {
      return `${todayHours.openingTime} - ${todayHours.closingTime}`;
    }
    return "Closed Today";
  };

  const getFullAddress = () => {
    const parts = [organization.street, organization.city];
    if (organization.state) parts.push(organization.state);
    return parts.join(", ");
  };

  const allTimeSlots = (organization.timeSlots || []).map((slot: any) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable ?? true,
  }));

  return (
    <div className="flex flex-row gap-2">
      <div className="max-w-157 mx-2">
        <div className="w-157 h-85 relative rounded-xl overflow-hidden mb-4">
          <Link
            href={returnTo}
            className="absolute top-2 left-2 z-10 bg-black/70 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft />
          </Link>
          <Image
            src={profileImageUrl || building}
            alt={organization.organizationName}
            fill
            style={{ objectFit: "cover" }}
            unoptimized={!!profileImageUrl}
          />
        </div>
        <div className="max-h-70 h-70 flex flex-col gap-4 mb-2 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="w-full mt-2 text-sm space-y-1">
            <div className="flex flex-row justify-between">
              <div className="space-y-2">
                <h1 className="font-semibold text-xl my-1 mb-3 line-clamp-1">
                  {organization.organizationName}
                </h1>
                <div className="flex flex-row gap-2">
                  <MapPinIcon className="w-5 text-red-600 shrink-0" />
                  <p>{getFullAddress()}</p>
                </div>
                <div className="flex flex-row gap-2">
                  <PhoneIcon className="w-3.5 text-gray-600 shrink-0" />
                  <p>{organization.contactPhone}</p>
                </div>
                <div className="flex flex-row gap-2">
                  <ClockIcon className="w-5 text-gray-600 shrink-0" />
                  <p>{getTodayWorkingHours()}</p>
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-gray-400" />
            <p className="line-clamp-3 overflow-hidden text-sm">
              {organization.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-start">
        <div className="w-xl">
          <OrganizationSidebar
            departments={
              organization.departments?.map((dept: any) => ({
                name: dept.name,
                description: dept.description,
                _id: dept._id?.toString() || dept.id?.toString(),
              })) || []
            }
            timeSlots={allTimeSlots}
            organizationId={organization._id?.toString()}
            organizationName={organization.organizationName}
            organizationType={organization.organizationType}
            fees={organization.fees}
          />
        </div>
      </div>
    </div>
  );
}
