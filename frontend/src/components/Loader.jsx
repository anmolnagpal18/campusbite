export const Loader = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};
