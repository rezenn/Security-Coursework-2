import {
  ClipboardClockIcon,
  ShieldCheckIcon,
  ChartSplineIcon,
} from "lucide-react";
export default function CredibilitySection() {
  return (
    <section className="w-full my-5 p-10 overflow-x-hidden border-fuchsia-700 ">
      <h2 className="text-3xl text-black/65 text-center">
        Trusted by Organizations That Value Efficiency
      </h2>
      <p className="my-2 text-md text-center text-black/50">
        From hospitals to universities, QuickPalo simplifies appointment
        management at scale.
      </p>
      <div className=" flex flex-row items-center justify-center gap-10 ">
        <div className="w-[300px] h-[95px] p-4 mt-7 bg-white rounded-2xl shadow-xl hover:scale-105">
          <div className="flex items-center">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
              <ClipboardClockIcon className="w-6 h-6 text-purple-700" />
            </div>

            {/* Text */}
            <div className="ml-4 flex flex-col items-center justify-center">
              <h4 className="text-2xl font-semibold text-black/80">
                Booking Managed
              </h4>
              <p className="text-sm text-black/50">
                Streamlined booking across institutions.
              </p>
            </div>
          </div>
        </div>
        <div className="w-[300px] h-[95px] p-4 mt-7 bg-white rounded-2xl shadow-xl hover:scale-105">
          <div className="flex items-center">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
              <ChartSplineIcon className="w-6 h-6 text-purple-700" />
            </div>

            {/* Text */}
            <div className="ml-4 flex flex-col items-center justify-center">
              <h4 className="text-2xl font-semibold text-black/80">
                99.99% Uptime
              </h4>
              <p className="text-sm text-black/50">
                Reliable access when it matters most.
              </p>
            </div>
          </div>
        </div>
        <div className="w-[300px] h-[95px] p-4 mt-7 bg-white rounded-2xl shadow-xl hover:scale-105">
          <div className="flex items-center">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
              <ShieldCheckIcon className="w-6 h-6 text-purple-700" />
            </div>

            {/* Text */}
            <div className="ml-4 flex flex-col items-center justify-center">
              <h4 className="text-2xl font-semibold text-black/80">
                Secure & Reliable
              </h4>
              <p className="text-sm text-black/50">
                Built with modern security standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
