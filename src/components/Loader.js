export default function Loader() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Spinning circle */}
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

// Full page loader variant
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Spinning circles */}
          <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Button loader variant (small)
export function ButtonLoader() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
