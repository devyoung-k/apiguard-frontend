'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { SystemAdminGuard } from '@/components/SystemAdminGuard';
import { PageErrorState, PageLoadingState } from '@/components/ui/page-states';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as adminApi from '@/lib/api/admin';
import type { AdminUserResponse, UserRole } from '@/types/api';

export function SystemAdminUsersPage() {
  const t = useTranslations('systemAdmin.users');
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [roleDraft, setRoleDraft] = useState<Record<number, UserRole>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingUserId, setIsSavingUserId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserResponse | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAdminUsers();
      setUsers(data);
      setRoleDraft(
        Object.fromEntries(data.map((user) => [user.id, user.role])) as Record<number, UserRole>,
      );
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.loadFailed')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))),
    [users],
  );

  const handleRoleChange = async (userId: number) => {
    const nextRole = roleDraft[userId];
    const user = users.find((item) => item.id === userId);
    if (!nextRole || !user || user.role === nextRole) {
      return;
    }

    setIsSavingUserId(userId);
    try {
      await adminApi.updateAdminUserRole(userId, { role: nextRole });
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, role: nextRole } : item)));
      toast.success(t('toasts.roleUpdated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.roleUpdateFailed')));
      setRoleDraft((prev) => ({ ...prev, [userId]: user.role }));
    } finally {
      setIsSavingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) {
      return;
    }

    setIsSavingUserId(deletingUser.id);
    try {
      await adminApi.deleteAdminUser(deletingUser.id);
      setUsers((prev) => prev.filter((item) => item.id !== deletingUser.id));
      toast.success(t('toasts.deleted'));
      setDeletingUser(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.deleteFailed')));
    } finally {
      setIsSavingUserId(null);
    }
  };

  return (
    <SystemAdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => void fetchUsers()}>
            {t('actions.refresh')}
          </Button>
        </div>

        {isLoading ? (
          <PageLoadingState />
        ) : error ? (
          <PageErrorState message={error} onAction={() => void fetchUsers()} actionLabel={t('actions.retry')} />
        ) : (
          <div className="rounded-xl border bg-card p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.email')}</TableHead>
                  <TableHead>{t('table.nickname')}</TableHead>
                  <TableHead>{t('table.role')}</TableHead>
                  <TableHead>{t('table.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => {
                  const draftRole = roleDraft[user.id] ?? user.role;
                  const isBusy = isSavingUserId === user.id;
                  const isDirty = draftRole !== user.role;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.nickname}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            value={draftRole}
                            onChange={(e) =>
                              setRoleDraft((prev) => ({
                                ...prev,
                                [user.id]: e.target.value as UserRole,
                              }))
                            }
                            className="rounded-md border bg-background px-2 py-1 text-sm"
                            disabled={isBusy}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'outline'}>{user.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isDirty || isBusy}
                            onClick={() => void handleRoleChange(user.id)}
                          >
                            {t('actions.saveRole')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            onClick={() => setDeletingUser(user)}
                          >
                            {t('actions.delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {sortedUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description', {
                email: deletingUser?.email ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              {t('actions.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SystemAdminGuard>
  );
}
