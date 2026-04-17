import { useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children}: {children: React.ReactNode}) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


export default ProtectedRoute