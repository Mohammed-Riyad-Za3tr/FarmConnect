import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

import { useAuth } from '../providers/AuthProvider';

interface LogoutButtonProps {
  className: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onConfirmLogout() {
    try {
      setBusy(true);
      await logout();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {t('nav.logout')}
      </button>

      <ConfirmDialog
        open={open}
        title={t('auth.logoutTitle')}
        description={t('auth.logoutConfirm')}
        confirmLabel={t('nav.logout')}
        cancelLabel={t('common.cancel')}
        confirmVariant="danger"
        busy={busy}
        onConfirm={onConfirmLogout}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
