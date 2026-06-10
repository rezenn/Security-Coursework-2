import {
  ClipboardClockIcon,
  ShieldCheckIcon,
  ClockIcon,
  User2Icon,
  BellRingIcon,
  ClipboardCheckIcon,
} from "lucide-react";

const featuresData = [
  {
    title: "Booking Managed",
    description:
      "Streamlined booking across institutions with real-time control.",
    icon: ClipboardClockIcon,
  },
  {
    title: "Schedule Optimization",
    description:
      "Easily assign time slots and resources for maximum efficiency.",
    icon: ClockIcon,
  },
  {
    title: "User Management",
    description: "Keep track of users, departments, and access privileges.",
    icon: User2Icon,
  },
  {
    title: "Notifications",
    description: "Automated reminders and notifications for appointments.",
    icon: BellRingIcon,
  },
  {
    title: "Reporting",
    description: "Generate reports for better decision-making and analytics.",
    icon: ClipboardCheckIcon,
  },
  {
    title: "Security",
    description: "Advanced permissions and secure data handling for all users.",
    icon: ShieldCheckIcon,
  },
];

export default function Features() {
  return (
    <div className="w-full max-w-full overflow-hidden px-4 md:px-8">
      <h2 className="text-3xl text-black/95 text-center">
        Everything You Need to Manage Appointments Seamlessly
      </h2>
      <p className="my-2 text-md text-center text-black/75">
        Core functionality designed for clarity, reliability, and real-world
        workflows.
      </p>

      <div className="my-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 -gap-x-9 justify-items-center">
        {featuresData.map((feature, index) => (
          <div
            key={index}
            className="w-[280px] p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl 
                       hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center gap-4">
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-700 shadow-lg">
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Text */}
              <div className="space-y-1">
                <h4 className="text-xl font-semibold tracking-tight text-gray-900">
                  {feature.title}
                </h4>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
