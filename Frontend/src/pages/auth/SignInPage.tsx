import { SignIn } from '@clerk/clerk-react';

export const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budget Watchdog
          </h1>
          <p className="text-gray-600">
            Sign in to access the dashboard
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard/overview"
          forceRedirectUrl="/dashboard/overview"
        />
      </div>
    </div>
  );
};
