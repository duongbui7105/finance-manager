import { CheckCircle, XCircle, Info, X } from "lucide-react";

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error:   <XCircle     className="h-5 w-5 text-red-500"   />,
  info:    <Info        className="h-5 w-5 text-blue-500"  />,
};

const colors = {
  success: "border-l-green-500",
  error:   "border-l-red-500",
  info:    "border-l-blue-500",
};

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id}
          className={`flex items-start gap-3 bg-white rounded-xl shadow-lg
                      border border-l-4 ${colors[t.type]} px-4 py-3 min-w-72
                      animate-in slide-in-from-right-4 duration-200`}>
          {icons[t.type]}
          <p className="text-sm text-gray-700 flex-1">{t.message}</p>
        </div>
      ))}
    </div>
  );
}