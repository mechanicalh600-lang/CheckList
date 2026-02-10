import React, { Dispatch, FormEvent, SetStateAction, Suspense } from 'react';
import { QRScanner } from './QRScanner';
import { Activity, ChecklistItemData, Equipment, InspectionForm, InspectionReportData, User } from '../types';
import { Navbar } from './Navbar';
import { ForcePasswordChangeView } from './views/ForcePasswordChangeView';
import { DashboardLoadingFallback } from './views/DashboardLoadingFallback';
import { HomeView } from './views/HomeView';
import { AssetSearchView } from './views/AssetSearchView';
import { ActivitySelectView } from './views/ActivitySelectView';
import { InspectionFormView } from './views/InspectionFormView';
import { SubmittingView } from './views/SubmittingView';
import { SuccessView } from './views/SuccessView';
import { HistoryView } from './views/HistoryView';

const AdminDashboard = React.lazy(() =>
  import('./AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const ReportsDashboard = React.lazy(() =>
  import('./ReportsDashboard').then((module) => ({ default: module.ReportsDashboard }))
) as React.ComponentType<any>;

interface AppRouterViews {
  FORCE_PASSWORD_CHANGE: string;
  ADMIN_DASHBOARD: string;
  REPORTS_DASHBOARD: string;
  HOME: string;
  SCANNER: string;
  ASSET_SEARCH: string;
  ACTIVITY_SELECT: string;
  FORM: string;
  SUBMITTING: string;
  SUCCESS: string;
  HISTORY: string;
}

interface NavbarProps {
  user: User | null;
  userAvatar: string | null;
  isSuperAdmin: boolean;
  onUserProfileClick: () => void;
  onSystemSettingsClick: () => void;
  onViewChange: (viewName: string) => void;
  onLogoutClick: () => void;
}

interface ForcePasswordProps {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordMessage: { type: 'success' | 'error'; text: string } | null;
  onSubmit: (event: FormEvent) => void;
}

interface DashboardProps {
  onAdminBack: () => Promise<void>;
  userRole: string;
  onDashboardViewReport: (report: InspectionReportData) => void;
  onBackHome: () => void;
}

interface HomeProps {
  isLoadingHistory: boolean;
  inspectionHistory: InspectionForm[];
  filterDateRange: { start: string; end: string };
  getTraditionalName: (equipmentCode: string) => string;
  getStatusColor: (status?: string) => string;
  formatHistoryDate: (timestamp: number) => string;
  onOpenScanner: () => void;
  onOpenAssetSearch: () => void;
  onOpenHistory: () => void;
}

interface InspectionProps {
  onScan: (payload: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredAssets: Array<{ code: string; name: string; description?: string }>;
  onBackToHome: () => void;
  currentEquipment: Equipment | null;
  availableActivities: Activity[];
  startInspection: (equipment: Equipment, activity?: Activity) => Promise<void>;
  selectedActivity: Activity | null;
  checklistItems: ChecklistItemData[];
  loadingChecklist: boolean;
  calculateProgress: () => number;
  getIncompleteCount: () => number;
  onUpdateItem: (item: ChecklistItemData) => void;
  onSubmitInspection: () => void;
  onBackToForm: () => void;
  submitError: string | null;
  loadingText: string;
}

interface SuccessProps {
  reportInspector: string;
  generatedTrackingCode: string;
  user: User | null;
  submissionDateObject: Date | null;
  currentEquipment: Equipment | null;
  checklistItems: ChecklistItemData[];
  analysisResult: string;
  returnToAdmin: boolean;
  onShareReport: () => void;
  onCloseFromAdmin: () => void;
  onResetApp: () => void;
}

interface HistoryProps {
  user: User | null;
  inspectionHistory: InspectionForm[];
  selectedHistoryIndices: number[];
  isLoadingHistory: boolean;
  filterDateRange: { start: string; end: string };
  setFilterDateRange: Dispatch<SetStateAction<{ start: string; end: string }>>;
  historyItemsPerPage: number;
  setHistoryItemsPerPage: Dispatch<SetStateAction<number>>;
  historyPage: number;
  setHistoryPage: Dispatch<SetStateAction<number>>;
  historyTotalPages: number;
  paginatedHistory: InspectionForm[];
  onSelectAllHistory: () => void;
  onExportExcel: () => void;
  onRefreshHistory: () => void;
  onToggleHistorySelection: (index: number) => void;
  getTraditionalName: (equipmentCode: string) => string;
  getStatusColor: (status?: string) => string;
}

interface AppRouterProps {
  view: string;
  views: AppRouterViews;
  navbar: NavbarProps;
  forcePassword: ForcePasswordProps;
  dashboard: DashboardProps;
  home: HomeProps;
  inspection: InspectionProps;
  success: SuccessProps;
  history: HistoryProps;
}

export const AppRouter = ({
  view,
  views,
  navbar,
  forcePassword,
  dashboard,
  home,
  inspection,
  success,
  history,
}: AppRouterProps) => {
  return (
    <>
      {view !== views.FORCE_PASSWORD_CHANGE &&
        view !== views.ADMIN_DASHBOARD &&
        view !== views.REPORTS_DASHBOARD && (
          <Navbar
            user={navbar.user}
            userAvatar={navbar.userAvatar}
            onUserProfileClick={navbar.onUserProfileClick}
            onSystemSettingsClick={() => {
              if (navbar.isSuperAdmin) navbar.onSystemSettingsClick();
            }}
            onViewChange={navbar.onViewChange}
            onLogoutClick={navbar.onLogoutClick}
          />
        )}

      {view === views.FORCE_PASSWORD_CHANGE && (
        <ForcePasswordChangeView
          newPassword={forcePassword.newPassword}
          setNewPassword={forcePassword.setNewPassword}
          confirmPassword={forcePassword.confirmPassword}
          setConfirmPassword={forcePassword.setConfirmPassword}
          passwordMessage={forcePassword.passwordMessage}
          onSubmit={forcePassword.onSubmit}
        />
      )}

      {view === views.ADMIN_DASHBOARD && (
        <Suspense
          fallback={
            <DashboardLoadingFallback
              message="در حال بارگذاری پنل مدیریت..."
              spinnerClassName="text-red-600"
            />
          }
        >
          <AdminDashboard
            onBack={dashboard.onAdminBack}
            userRole={dashboard.userRole}
            onViewReport={dashboard.onDashboardViewReport}
          />
        </Suspense>
      )}

      {view === views.REPORTS_DASHBOARD && (
        <Suspense
          fallback={
            <DashboardLoadingFallback
              message="در حال بارگذاری داشبوردها..."
              spinnerClassName="text-blue-600"
            />
          }
        >
          <ReportsDashboard
            onBack={dashboard.onBackHome}
            onViewReport={dashboard.onDashboardViewReport}
          />
        </Suspense>
      )}

      {view === views.HOME && (
        <HomeView
          isLoadingHistory={home.isLoadingHistory}
          inspectionHistory={home.inspectionHistory}
          filterDateRange={home.filterDateRange}
          getTraditionalName={home.getTraditionalName}
          getStatusColor={home.getStatusColor}
          formatHistoryDate={home.formatHistoryDate}
          onOpenScanner={home.onOpenScanner}
          onOpenAssetSearch={home.onOpenAssetSearch}
          onOpenHistory={home.onOpenHistory}
        />
      )}

      {view === views.SCANNER && (
        <QRScanner onScan={inspection.onScan} onClose={inspection.onBackToHome} />
      )}

      {view === views.ASSET_SEARCH && (
        <AssetSearchView
          searchTerm={inspection.searchTerm}
          setSearchTerm={inspection.setSearchTerm}
          filteredAssets={inspection.filteredAssets}
          onBack={inspection.onBackToHome}
          onAssetSelect={inspection.onScan}
        />
      )}

      {view === views.ACTIVITY_SELECT && (
        <ActivitySelectView
          currentEquipment={inspection.currentEquipment}
          availableActivities={inspection.availableActivities}
          onBack={inspection.onBackToHome}
          onSelectActivity={(activity) => {
            if (inspection.currentEquipment) {
              void inspection.startInspection(inspection.currentEquipment, activity);
            }
          }}
        />
      )}

      {view === views.FORM && (
        <InspectionFormView
          currentEquipment={inspection.currentEquipment}
          selectedActivity={inspection.selectedActivity}
          checklistItems={inspection.checklistItems}
          loadingChecklist={inspection.loadingChecklist}
          calculateProgress={inspection.calculateProgress}
          getIncompleteCount={inspection.getIncompleteCount}
          onClose={inspection.onBackToHome}
          onUpdateItem={inspection.onUpdateItem}
          onSubmit={inspection.onSubmitInspection}
        />
      )}

      {view === views.SUBMITTING && (
        <SubmittingView
          submitError={inspection.submitError}
          loadingText={inspection.loadingText}
          onRetry={inspection.onSubmitInspection}
          onBackToForm={inspection.onBackToForm}
        />
      )}

      {view === views.SUCCESS && (
        <SuccessView
          reportInspector={success.reportInspector}
          generatedTrackingCode={success.generatedTrackingCode}
          user={success.user}
          submissionDateObject={success.submissionDateObject}
          currentEquipment={success.currentEquipment}
          checklistItems={success.checklistItems}
          analysisResult={success.analysisResult}
          returnToAdmin={success.returnToAdmin}
          onShareReport={success.onShareReport}
          onCloseFromAdmin={success.onCloseFromAdmin}
          onResetApp={success.onResetApp}
        />
      )}

      {view === views.HISTORY && (
        <HistoryView
          user={history.user}
          inspectionHistory={history.inspectionHistory}
          selectedHistoryIndices={history.selectedHistoryIndices}
          isLoadingHistory={history.isLoadingHistory}
          filterDateRange={history.filterDateRange}
          setFilterDateRange={history.setFilterDateRange}
          historyItemsPerPage={history.historyItemsPerPage}
          setHistoryItemsPerPage={history.setHistoryItemsPerPage}
          historyPage={history.historyPage}
          setHistoryPage={history.setHistoryPage}
          historyTotalPages={history.historyTotalPages}
          paginatedHistory={history.paginatedHistory}
          onBack={inspection.onBackToHome}
          onSelectAllHistory={history.onSelectAllHistory}
          onExportExcel={history.onExportExcel}
          onRefreshHistory={history.onRefreshHistory}
          onToggleHistorySelection={history.onToggleHistorySelection}
          getTraditionalName={history.getTraditionalName}
          getStatusColor={history.getStatusColor}
        />
      )}
    </>
  );
};
