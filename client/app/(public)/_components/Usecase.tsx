import Image from "next/image";
import universityImage from "@/app/assets/images/universityFeatures.jpg";
import hospitalImage from "@/app/assets/images/hospitalFeatures.jpg";
import clinicImage from "@/app/assets/images/clinicsFeatures.jpg";
import corporateImage from "@/app/assets/images/corporateBuildingFeatures.jpg";

export default function Usecase() {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <h2 className="text-3xl  text-black/95 text-center">
        Built for Institutions That Rely on Structured Schedulings{" "}
      </h2>
      <p className="my-2 text-md text-center text-black/75">
        A flexible booking system that adapts to different organizational needs.{" "}
      </p>
      <div className="my-10 flex flex-wrap justify-center gap-8">
        <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl overflow-hidden w-[220px] hover:scale-105 ">
          {/* Image */}
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-2xl">
            <Image
              src={universityImage}
              alt="University image"
              className="object-contain rounded-2xl"
              width={200}
              height={120}
            />
          </div>

          {/* Text */}
          <div className="p-4 text-center">
            <h4 className="text-sm font-semibold text-black/80">
              Universities & Colleges{" "}
            </h4>
          </div>
        </div>
        <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl overflow-hidden w-[220px] hover:scale-105">
          {/* Image */}
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-2xl">
            <Image
              src={hospitalImage}
              alt="Hospital image"
              className="object-contain rounded-2xl"
              width={200}
              height={120}
            />
          </div>

          {/* Text */}
          <div className="p-4 text-center">
            <h4 className="text-sm font-semibold text-black/80">Hospitals </h4>
          </div>
        </div>
        <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl overflow-hidden w-[220px] hover:scale-105">
          {/* Image */}
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-2xl">
            <Image
              src={clinicImage}
              alt="Clinic image"
              className="object-contain rounded-2xl"
              width={200}
              height={120}
            />
          </div>

          {/* Text */}
          <div className="p-4 text-center">
            <h4 className="text-sm font-semibold text-black/80">Clinics </h4>
          </div>
        </div>
        <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl overflow-hidden w-[220px] hover:scale-105">
          {/* Image */}
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-2xl">
            <Image
              src={corporateImage}
              alt="Corporate image"
              className="object-contain rounded-2xl"
              width={200}
              height={120}
            />
          </div>

          {/* Text */}
          <div className="p-4 text-center">
            <h4 className="text-sm font-semibold text-black/80">
              Professional Organizations{" "}
            </h4>
          </div>
        </div>
        <p className="w-3xl flex items-center justify-center text-md text-center text-black/75 mt-1">
          Structured scheduling for academic environments Reliable appointment
          management for healthcare Efficient booking for outpatient services
          Organized scheduling for service-based teams
        </p>
      </div>
    </div>
  );
}
