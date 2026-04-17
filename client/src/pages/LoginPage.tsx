import { SignIn, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <SignIn />
    </div>
  );
};

export default LoginPage;
