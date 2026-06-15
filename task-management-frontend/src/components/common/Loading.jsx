export default function Loading() {
  return (
    <div className="flex justify-center items-center py-10">
      <div
        className="w-8 h-8 border-4 border-indigo-500 dark:border-indigo-400
        border-t-transparent rounded-full animate-spin transition-colors duration-300"
      />
    </div>
  );
}
