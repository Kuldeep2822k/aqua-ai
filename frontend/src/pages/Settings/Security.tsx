import { useState } from 'react';
import { Key, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

const SecurityHeader = () => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      Security Settings
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Manage your account security and authentication
    </p>
  </div>
);

const PasswordSection = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Change Password
    </h3>

    <div className="space-y-4">
      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Current Password
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="currentPassword"
            type="password"
            placeholder="Enter current password"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          New Password
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <button
      type="button"
      className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
    >
      Update Password
    </button>
  </div>
);

const TwoFactorSection = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Two-Factor Authentication
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Add an extra layer of security to your account
    </p>

    <button
      type="button"
      className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 font-medium"
    >
      Enable 2FA
    </button>
  </div>
);

interface DangerZoneProps {
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  isDeletingAccount: boolean;
  onDeleteAccount: () => void;
}

const DangerZone = ({
  showDeleteDialog,
  setShowDeleteDialog,
  isDeletingAccount,
  onDeleteAccount,
}: DangerZoneProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-red-200 dark:border-red-900/50 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
      Danger Zone
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Irreversible and destructive actions
    </p>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={isDeletingAccount}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteAccount}
            className="bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500"
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);

export function Security() {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) {
      return;
    }
    setIsDeletingAccount(true);
    const toastId = toast.loading('Deleting account...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.error('Account deletion is not configured yet', { id: toastId });
    } catch {
      toast.error('Failed to delete account', { id: toastId });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <SecurityHeader />
      <PasswordSection />
      <TwoFactorSection />
      <DangerZone
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        isDeletingAccount={isDeletingAccount}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
