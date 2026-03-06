import { UserButton, useUser } from '@clerk/clerk-react';

export const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className="bg-white border-b border-gray-200 lg:ml-64 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user?.firstName || 'User'}
          </h2>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
              },
            }}
            afterSignOutUrl="/sign-in"
          />
        </div>
      </div>
    </header>
  );
};
