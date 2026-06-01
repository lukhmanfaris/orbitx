import React, { createContext, useContext } from 'react';
import { useAuth, UseAuthReturn } from './hooks/useAuth';
import { useWorkspace, UseWorkspaceReturn } from './hooks/useWorkspace';
import { useMedia, UseMediaReturn } from './hooks/useMedia';
import { useArticles, UseArticlesReturn } from './hooks/useArticles';
import { useOnboarding, UseOnboardingReturn } from './hooks/useOnboarding';
import { useActivity, ActivityEntry, UseActivityReturn } from './hooks/useActivity';
import { useToast, UseToastReturn } from './hooks/useToast';

export type { ActivityEntry } from './hooks/useActivity';

export interface AppContextValue
  extends UseAuthReturn,
    UseWorkspaceReturn,
    UseMediaReturn,
    UseArticlesReturn,
    UseOnboardingReturn,
    UseActivityReturn,
    UseToastReturn {}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function useAppState(): AppContextValue {
  const auth = useAuth();
  const { currentUser } = auth;
  const toast = useToast();
  const { addToast } = toast;
  const workspace = useWorkspace({ currentUser, addToast });
  const { selectedPostingId } = workspace;
  const media = useMedia({ currentUser, selectedPostingId, addToast });

  const articles = useArticles({ currentUser, currentCompanyId: workspace.currentCompany?.id || '', addToast });
  const onboarding = useOnboarding({ currentUser, addToast });
  const activity = useActivity({ currentUser });

  return {
    ...auth,
    ...workspace,
    ...media,
    ...articles,
    ...onboarding,
    ...activity,
    ...toast,
  };
}
