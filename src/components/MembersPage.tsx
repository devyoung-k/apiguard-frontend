'use client';

import { useState, useCallback } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';
import { canManageMembers } from '@/lib/permissions';
import { ASSIGNABLE_ROLES } from '@/lib/permissions';
import * as workspacesApi from '@/lib/api/workspaces';
import type { WorkspaceRole } from '@/types/api';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  ShieldCheck,
  Eye,
  UserCog,
  Crown,
} from 'lucide-react';

const ROLE_ICONS: Record<WorkspaceRole, typeof Shield> = {
  owner: Crown,
  admin: ShieldCheck,
  member: UserCog,
  viewer: Eye,
};

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  member:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function MembersPage() {
  const { members, currentWorkspace, myRole, refreshMembers } = useWorkspace();
  const { user } = useAuth();
  const t = useTranslations('admin.members');
  const tp = useTranslations('permissions');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member');
  const [isInviting, setIsInviting] = useState(false);

  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = canManageMembers(myRole);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim()) {
      toast.error(t('errors.enterEmail'));
      return;
    }
    if (!currentWorkspace) return;

    setIsInviting(true);
    try {
      await workspacesApi.inviteMember(currentWorkspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(t('toasts.invited'));
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteOpen(false);
      await refreshMembers();
    } catch {
      toast.error(t('errors.inviteFailed'));
    } finally {
      setIsInviting(false);
    }
  }, [inviteEmail, inviteRole, currentWorkspace, refreshMembers, t]);

  const handleRoleChange = useCallback(
    async (memberId: number, newRole: WorkspaceRole) => {
      if (!currentWorkspace) return;
      setIsProcessing(true);
      try {
        await workspacesApi.updateMemberRole(currentWorkspace.id, memberId, {
          role: newRole,
        });
        toast.success(t('toasts.roleUpdated'));
        setEditingMemberId(null);
        await refreshMembers();
      } catch {
        toast.error(t('errors.updateRoleFailed'));
      } finally {
        setIsProcessing(false);
      }
    },
    [currentWorkspace, refreshMembers, t],
  );

  const handleRemove = useCallback(
    async (memberId: number) => {
      if (!currentWorkspace) return;
      setIsProcessing(true);
      try {
        await workspacesApi.removeMember(currentWorkspace.id, memberId);
        toast.success(t('toasts.removed'));
        setRemovingMemberId(null);
        await refreshMembers();
      } catch {
        toast.error(t('errors.removeFailed'));
      } finally {
        setIsProcessing(false);
      }
    },
    [currentWorkspace, refreshMembers, t],
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {tp('noAccess')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">{tp('contactAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-7 w-7" />
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="h-4 w-4" />
          {t('invite')}
        </button>
      </div>

      {/* 초대 다이얼로그 */}
      {isInviteOpen && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800/50 dark:bg-blue-900/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('invite')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {tp(`roles.${role}`)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleInvite}
                disabled={isInviting}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('invite')
                )}
              </button>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버 테이블 */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        {members.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            {t('empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('joined')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {members.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role];
                  const isMe = member.userId === user?.id;
                  const isOwner = member.role === 'owner';

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50"
                    >
                      {/* 이메일/닉네임 */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.nickname}
                            {isMe && (
                              <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                {t('you')}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </td>

                      {/* 역할 */}
                      <td className="px-6 py-4">
                        {editingMemberId === member.id ? (
                          <select
                            defaultValue={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.id,
                                e.target.value as WorkspaceRole,
                              )
                            }
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            {ASSIGNABLE_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {tp(`roles.${role}`)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {tp(`roles.${member.role}`)}
                          </span>
                        )}
                      </td>

                      {/* 가입일 */}
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>

                      {/* 액션 */}
                      <td className="px-6 py-4 text-right">
                        {!isMe && !isOwner && (
                          <div className="flex items-center justify-end gap-2">
                            {editingMemberId === member.id ? (
                              <button
                                onClick={() => setEditingMemberId(null)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                              >
                                {t('cancel')}
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingMemberId(member.id)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                {t('changeRole')}
                              </button>
                            )}

                            {removingMemberId === member.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRemove(member.id)}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    t('removeMember')
                                  )}
                                </button>
                                <button
                                  onClick={() => setRemovingMemberId(null)}
                                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                                >
                                  {t('cancel')}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRemovingMemberId(member.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title={t('removeMember')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
