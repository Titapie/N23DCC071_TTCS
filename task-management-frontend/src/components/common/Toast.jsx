export default function Toast({ message, type = "success", onClose }) {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-indigo-500",
  };

  return (
    <div
      onClick={onClose}
      className={`fixed bottom-6 right-6 z-50 text-white px-6 py-4
      rounded-xl shadow-2xl ${colors[type]} cursor-pointer
      animate-in slide-in-from-bottom-5 fade-in duration-300
      flex items-center gap-3 font-medium`}
    >
      {message}
    </div>
  );
}
