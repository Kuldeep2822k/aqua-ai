import { useState } from 'react';
import { Mail, Phone, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';

const AccountHeader = () => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      Account Settings
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Manage your account information and preferences
    </p>
  </div>
);

interface ProfileFormProps {
  isSaving: boolean;
  onSave: () => void;
}

const ProfileForm = ({ isSaving, onSave }: ProfileFormProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Profile Information
    </h3>

    <div className="flex items-center gap-6 mb-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
        JD
      </div>
      <div>
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium mb-2"
        >
          Change Photo
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          JPG, PNG or GIF. Max size 2MB.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          defaultValue="John"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          defaultValue="Doe"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="email"
            type="email"
            defaultValue="john.doe@example.com"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Phone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="phone"
            type="tel"
            defaultValue="+91 98765 43210"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="col-span-2">
        <label
          htmlFor="organization"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Organization
        </label>
        <input
          id="organization"
          type="text"
          defaultValue="Central Pollution Control Board"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="col-span-2">
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="location"
            type="text"
            defaultValue="New Delhi, India"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <div className="flex justify-end mt-6">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>
);

export function Account() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) {return;}
    setIsSaving(true);
    const toastId = toast.loading('Saving changes...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success('Changes saved', { id: toastId });
    } catch {
      toast.error('Failed to save changes', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AccountHeader />
      <ProfileForm isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}

