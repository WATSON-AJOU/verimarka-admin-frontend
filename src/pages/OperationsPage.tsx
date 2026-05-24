import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { EmptyTableRow, ErrorBlock, LoadingBlock, PaginationControls, SectionLayout } from "../components/common/AdminShared";
import { StatusPill } from "../components/common/StatusPill";
import { mutateAdminJson } from "../lib/api";
import { useAdminResource } from "../hooks/useAdminResource";
import type {
  AdminActionLog,
  ModerationCase,
  OperationJob,
  OperationNotification,
  OperationSummary,
  PaginatedResponse,
  PolicyVersion,
  ReportCase,
  RetentionRequest,
} from "../types/admin";

const PAGE_SIZE = 10;
type OperationsTab = "queue" | "reports" | "jobs" | "retention" | "messages" | "audit";

type ConfirmAction = {
  title: string;
  body: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
};

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<OperationsTab>("queue");
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [reportResolution, setReportResolution] = useState<Record<number, string>>({});
  const [retentionNote, setRetentionNote] = useState<Record<number, string>>({});
  const [selectedReport, setSelectedReport] = useState<ReportCase | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminActionLog | null>(null);
  const [reportFilters, setReportFilters] = useState({ q: "", status: "", report_type: "" });
  const [jobFilters, setJobFilters] = useState({ q: "", status: "failure", job_type: "" });
  const [auditFilters, setAuditFilters] = useState({ q: "", action: "", target_type: "", created_from: "", created_to: "" });
  const [reportPage, setReportPage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [notificationForm, setNotificationForm] = useState({
    user_id: "",
    channel: "in_app",
    title: "",
    message: "",
  });
  const [policyForm, setPolicyForm] = useState({
    policy_type: "terms",
    version: "",
    title: "",
    body: "",
  });
  const [retentionForm, setRetentionForm] = useState({
    request_type: "delete_content",
    target_type: "content",
    target_id: "",
    reason: "",
  });

  const refreshParam = `r=${refreshKey}`;
  const reportPath = useMemo(() => {
    const params = new URLSearchParams({ page: String(reportPage), page_size: String(PAGE_SIZE), ...compactParams(reportFilters), r: String(refreshKey) });
    return `/api/operations/admin/reports/?${params.toString()}`;
  }, [refreshKey, reportFilters, reportPage]);
  const jobPath = useMemo(() => {
    const params = new URLSearchParams({ page: String(jobPage), page_size: String(PAGE_SIZE), ...compactParams(jobFilters), r: String(refreshKey) });
    return `/api/operations/admin/jobs/?${params.toString()}`;
  }, [jobFilters, jobPage, refreshKey]);
  const auditPath = useMemo(() => {
    const params = new URLSearchParams({ page: String(auditPage), page_size: String(PAGE_SIZE), ...compactParams(auditFilters), r: String(refreshKey) });
    return `/api/operations/admin/audit-logs/?${params.toString()}`;
  }, [auditFilters, auditPage, refreshKey]);

  const summary = useAdminResource<OperationSummary>(`/api/operations/admin/summary/?${refreshParam}`, { refreshMs: 5000 });
  const reports = useAdminResource<PaginatedResponse<ReportCase>>(reportPath);
  const moderation = useAdminResource<PaginatedResponse<ModerationCase>>(`/api/operations/admin/moderation-cases/?page_size=${PAGE_SIZE}&${refreshParam}`);
  const retention = useAdminResource<PaginatedResponse<RetentionRequest>>(`/api/operations/admin/retention-requests/?page_size=${PAGE_SIZE}&${refreshParam}`);
  const notifications = useAdminResource<PaginatedResponse<OperationNotification>>(`/api/operations/admin/notifications/?page_size=${PAGE_SIZE}&${refreshParam}`);
  const jobs = useAdminResource<PaginatedResponse<OperationJob>>(jobPath, { refreshMs: activeTab === "jobs" ? 5000 : undefined });
  const auditLogs = useAdminResource<PaginatedResponse<AdminActionLog>>(auditPath);
  const policies = useAdminResource<PolicyVersion[]>(`/api/operations/admin/policies/?${refreshParam}`);

  function refreshAll(nextMessage: string) {
    setMessage(nextMessage);
    setErrorMessage("");
    setRefreshKey((value) => value + 1);
  }

  async function runConfirmed() {
    if (!confirmAction) return;
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "요청 처리에 실패했습니다.");
      setConfirmAction(null);
    }
  }

  async function updateReport(reportId: number, status: string) {
    const resolution = reportResolution[reportId] || "";
    await mutateAdminJson(`/api/operations/admin/reports/${reportId}/`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolution, assign_to_me: true }),
    });
    refreshAll("신고 케이스가 업데이트되었습니다.");
  }

  async function updateRetention(retentionId: number, status: string) {
    await mutateAdminJson(`/api/operations/admin/retention-requests/${retentionId}/`, {
      method: "PATCH",
      body: JSON.stringify({ status, decision_note: retentionNote[retentionId] || "" }),
    });
    refreshAll("보관/삭제 요청이 업데이트되었습니다.");
  }

  async function changeJob(jobId: string, action: "retry" | "cancel") {
    await mutateAdminJson(`/api/operations/admin/jobs/${jobId}/${action}/`, { method: "POST" });
    refreshAll(action === "retry" ? "실패 job 재처리를 요청했습니다." : "실행 중 job을 취소했습니다.");
  }

  async function createNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await mutateAdminJson("/api/operations/admin/notifications/", {
        method: "POST",
        body: JSON.stringify({
          user_id: Number(notificationForm.user_id),
          channel: notificationForm.channel,
          title: notificationForm.title,
          message: notificationForm.message,
        }),
      });
      setNotificationForm({ user_id: "", channel: "in_app", title: "", message: "" });
      refreshAll("알림이 생성되었습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "알림 생성에 실패했습니다.");
    }
  }

  function requestPolicyPublish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmAction({
      title: "정책 버전을 게시할까요?",
      body: `${policyForm.policy_type} ${policyForm.version} 버전이 활성 정책으로 게시됩니다. 기존 활성 버전은 비활성화됩니다.`,
      confirmText: "게시",
      danger: true,
      onConfirm: async () => {
        await mutateAdminJson("/api/operations/admin/policies/", {
          method: "POST",
          body: JSON.stringify({ ...policyForm, publish: true }),
        });
        setPolicyForm({ policy_type: "terms", version: "", title: "", body: "" });
        refreshAll("정책 버전이 게시되었습니다.");
      },
    });
  }

  function requestRetentionCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmAction({
      title: "보관/삭제 요청을 생성할까요?",
      body: `${retentionForm.target_type}:${retentionForm.target_id} 대상에 ${retentionForm.request_type} 요청을 생성합니다.`,
      confirmText: "요청 생성",
      danger: true,
      onConfirm: async () => {
        await mutateAdminJson("/api/operations/admin/retention-requests/", {
          method: "POST",
          body: JSON.stringify(retentionForm),
        });
        setRetentionForm({ request_type: "delete_content", target_type: "content", target_id: "", reason: "" });
        refreshAll("보관/삭제 요청이 생성되었습니다.");
      },
    });
  }

  return (
    <SectionLayout title="운영 백오피스">
      {message ? <div className="operation-toast">{message}</div> : null}
      {errorMessage ? <div className="operation-toast is-error">{errorMessage}</div> : null}
      {summary.loading ? <LoadingBlock /> : null}
      {summary.error ? <ErrorBlock message={summary.error} /> : null}
      {summary.data ? (
        <div className="operation-metrics">
          <Metric label="미처리 신고" value={summary.data.open_reports} onClick={() => setActiveTab("reports")} />
          <Metric label="보관/삭제 대기" value={summary.data.pending_retention_requests} onClick={() => setActiveTab("retention")} />
          <Metric label="실패 Job" value={summary.data.failed_jobs} onClick={() => setActiveTab("jobs")} />
          <Metric label="진행 중 Job" value={summary.data.running_jobs} onClick={() => { setJobFilters((current) => ({ ...current, status: "running" })); setActiveTab("jobs"); }} />
          <Metric label="오늘 심사" value={summary.data.moderation_cases_today} onClick={() => setActiveTab("queue")} />
          <Metric label="발송 대기 알림" value={summary.data.notifications_queued} onClick={() => setActiveTab("messages")} />
        </div>
      ) : null}

      <div className="operation-tabs" role="tablist" aria-label="운영 메뉴">
        <TabButton label="처리 큐" value="queue" activeTab={activeTab} onChange={setActiveTab} />
        <TabButton label="신고" value="reports" activeTab={activeTab} onChange={setActiveTab} />
        <TabButton label="Job" value="jobs" activeTab={activeTab} onChange={setActiveTab} />
        <TabButton label="보관/삭제" value="retention" activeTab={activeTab} onChange={setActiveTab} />
        <TabButton label="알림/정책" value="messages" activeTab={activeTab} onChange={setActiveTab} />
        <TabButton label="감사 로그" value="audit" activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "queue" ? (
        <div className="operation-grid">
          <ModerationPanel data={moderation.data} />
          <LatestActionsPanel actions={summary.data?.latest_actions ?? []} onSelect={setSelectedLog} />
          <ReportQueuePanel reports={reports.data?.results ?? []} onOpen={(report) => { setSelectedReport(report); setActiveTab("reports"); }} />
          <JobQueuePanel jobs={jobs.data?.results ?? []} onOpenJobs={() => setActiveTab("jobs")} />
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <article className="admin-card operation-panel">
          <PanelHead title="신고/이의제기" description="신고 내용을 확인하고 담당자 배정, 조사, 해결, 거절 처리를 진행합니다." />
          <div className="filter-row operation-toolbar">
            <input className="search-input" value={reportFilters.q} onChange={(event) => { setReportPage(1); setReportFilters((current) => ({ ...current, q: event.target.value })); }} placeholder="제목, 파일명, 신고자 검색" />
            <select className="filter-select" value={reportFilters.status} onChange={(event) => { setReportPage(1); setReportFilters((current) => ({ ...current, status: event.target.value })); }}>
              <option value="">전체 상태</option>
              <option value="open">open</option>
              <option value="investigating">investigating</option>
              <option value="resolved">resolved</option>
              <option value="rejected">rejected</option>
            </select>
            <select className="filter-select" value={reportFilters.report_type} onChange={(event) => { setReportPage(1); setReportFilters((current) => ({ ...current, report_type: event.target.value })); }}>
              <option value="">전체 유형</option>
              <option value="copyright">copyright</option>
              <option value="impersonation">impersonation</option>
              <option value="abuse">abuse</option>
              <option value="other">other</option>
            </select>
          </div>
          {reports.error ? <ErrorBlock message={reports.error} /> : null}
          {reports.loading ? <LoadingBlock /> : null}
          {reports.data ? (
            <>
              <div className="table-wrap">
                <table className="admin-table compact">
                  <thead><tr><th>제목</th><th>상태</th><th>대상</th><th>담당</th><th>처리</th></tr></thead>
                  <tbody>
                    {reports.data.results.length === 0 ? <EmptyTableRow colSpan={5} message="신고 케이스가 없습니다." /> : reports.data.results.map((report) => (
                      <tr key={report.id}>
                        <td><button type="button" className="text-button" onClick={() => setSelectedReport(report)}>{report.title}</button><span className="table-subtext">{report.reporter_email || "익명"} · {report.report_type}</span></td>
                        <td><StatusPill value={report.status} /></td>
                        <td><NavLink className="table-link" to={`/images/${report.content_public_id}`}>{report.file_name}</NavLink></td>
                        <td>{report.assignee_email || "-"}</td>
                        <td>
                          <div className="inline-actions">
                            <input value={reportResolution[report.id] || ""} onChange={(event) => setReportResolution((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="처리 메모" />
                            <button type="button" className="ghost-button" onClick={() => void updateReport(report.id, "investigating")}>조사</button>
                            <button type="button" className="ghost-button" onClick={() => setConfirmAction({ title: "신고를 해결 처리할까요?", body: "처리 메모가 감사 로그에 남습니다.", confirmText: "해결", onConfirm: () => updateReport(report.id, "resolved") })}>해결</button>
                            <button type="button" className="ghost-button danger" onClick={() => setConfirmAction({ title: "신고를 거절할까요?", body: "거절 사유를 처리 메모에 입력했는지 확인하세요.", confirmText: "거절", danger: true, onConfirm: () => updateReport(report.id, "rejected") })}>거절</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={reports.data.page} totalPages={reports.data.total_pages} totalCount={reports.data.total_count} onPrev={() => setReportPage((page) => Math.max(1, page - 1))} onNext={() => setReportPage((page) => Math.min(reports.data?.total_pages ?? page, page + 1))} />
            </>
          ) : null}
        </article>
      ) : null}

      {activeTab === "jobs" ? (
        <article className="admin-card operation-panel">
          <PanelHead title="AI Job 모니터링" description="실패 Job 재처리와 실행 중 Job 취소를 관리합니다." />
          <div className="filter-row operation-toolbar">
            <input className="search-input" value={jobFilters.q} onChange={(event) => { setJobPage(1); setJobFilters((current) => ({ ...current, q: event.target.value })); }} placeholder="Job ID, 파일명, 사용자, 오류 검색" />
            <select className="filter-select" value={jobFilters.status} onChange={(event) => { setJobPage(1); setJobFilters((current) => ({ ...current, status: event.target.value })); }}>
              <option value="">전체 상태</option>
              <option value="queued">queued</option>
              <option value="running">running</option>
              <option value="success">success</option>
              <option value="failure">failure</option>
            </select>
            <select className="filter-select" value={jobFilters.job_type} onChange={(event) => { setJobPage(1); setJobFilters((current) => ({ ...current, job_type: event.target.value })); }}>
              <option value="">전체 유형</option>
              <option value="register">register</option>
              <option value="verify">verify</option>
              <option value="watermark">watermark</option>
            </select>
          </div>
          {jobs.error ? <ErrorBlock message={jobs.error} /> : null}
          {jobs.loading ? <LoadingBlock /> : null}
          {jobs.data ? (
            <>
              <div className="table-wrap">
                <table className="admin-table compact">
                  <thead><tr><th>Job</th><th>사용자</th><th>유형</th><th>상태</th><th>진행률</th><th>오류</th><th>액션</th></tr></thead>
                  <tbody>
                    {jobs.data.results.length === 0 ? <EmptyTableRow colSpan={7} message="조건에 맞는 job이 없습니다." /> : jobs.data.results.map((job) => (
                      <tr key={job.job_id}>
                        <td><strong>{job.job_id.slice(0, 8)}</strong><span className="table-subtext">{job.content_public_id ? <NavLink to={`/images/${job.content_public_id}`}>저작물 보기</NavLink> : "연결 저작물 없음"}</span></td>
                        <td>{job.owner_email}</td>
                        <td>{job.job_type}</td>
                        <td><StatusPill value={job.status} /></td>
                        <td><ProgressCell progress={job.progress} message={job.progress_message || job.updated_at} /></td>
                        <td>{job.error_code || job.error_message || "-"}</td>
                        <td>
                          <div className="inline-actions">
                            <button type="button" className="ghost-button" disabled={!job.retryable && job.status !== "failure"} onClick={() => setConfirmAction({ title: "Job을 재처리할까요?", body: `${job.job_id} 재처리 Job이 새로 생성됩니다.`, confirmText: "재처리", onConfirm: () => changeJob(job.job_id, "retry") })}>재처리</button>
                            <button type="button" className="ghost-button danger" disabled={!["queued", "running"].includes(job.status)} onClick={() => setConfirmAction({ title: "실행 중 Job을 취소할까요?", body: "취소된 Job은 실패 상태로 기록되고 감사 로그에 남습니다.", confirmText: "취소", danger: true, onConfirm: () => changeJob(job.job_id, "cancel") })}>취소</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={jobs.data.page} totalPages={jobs.data.total_pages} totalCount={jobs.data.total_count} onPrev={() => setJobPage((page) => Math.max(1, page - 1))} onNext={() => setJobPage((page) => Math.min(jobs.data?.total_pages ?? page, page + 1))} />
            </>
          ) : null}
        </article>
      ) : null}

      {activeTab === "retention" ? (
        <article className="admin-card operation-panel">
          <PanelHead title="보관/삭제 요청" description="콘텐츠 삭제, 사용자 익명화, 원본 파일 파기 같은 민감 작업을 요청하고 승인합니다." />
          <form className="operation-form horizontal retention-create" onSubmit={requestRetentionCreate}>
            <select value={retentionForm.request_type} onChange={(event) => setRetentionForm((current) => ({ ...current, request_type: event.target.value }))} className="filter-select">
              <option value="delete_content">콘텐츠 삭제</option>
              <option value="anonymize_user">사용자 익명화</option>
              <option value="purge_upload">업로드 파일 파기</option>
            </select>
            <select value={retentionForm.target_type} onChange={(event) => setRetentionForm((current) => ({ ...current, target_type: event.target.value }))} className="filter-select">
              <option value="content">content</option>
              <option value="user">user</option>
              <option value="storage_object">storage_object</option>
            </select>
            <input required value={retentionForm.target_id} onChange={(event) => setRetentionForm((current) => ({ ...current, target_id: event.target.value }))} placeholder="대상 ID" />
            <input required value={retentionForm.reason} onChange={(event) => setRetentionForm((current) => ({ ...current, reason: event.target.value }))} placeholder="요청 사유" />
            <button type="submit" className="action-button danger">요청 생성</button>
          </form>
          {retention.data ? (
            <div className="table-wrap">
              <table className="admin-table compact">
                <thead><tr><th>대상</th><th>유형</th><th>상태</th><th>요청 사유</th><th>처리</th></tr></thead>
                <tbody>
                  {retention.data.results.length === 0 ? <EmptyTableRow colSpan={5} message="보관/삭제 요청이 없습니다." /> : retention.data.results.map((item) => (
                    <tr key={item.id}>
                      <td>{item.target_type}:{item.target_id}<span className="table-subtext">{item.requester_email}</span></td>
                      <td>{item.request_type}</td>
                      <td><StatusPill value={item.status} /></td>
                      <td>{item.reason}</td>
                      <td>
                        <div className="inline-actions">
                          <input value={retentionNote[item.id] || ""} onChange={(event) => setRetentionNote((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="처리 메모" />
                          {["approved", "completed", "rejected"].map((status) => (
                            <button key={status} type="button" className="ghost-button" onClick={() => setConfirmAction({ title: `요청을 ${status} 처리할까요?`, body: "처리 메모와 상태 변경이 감사 로그에 남습니다.", confirmText: status, danger: status !== "approved", onConfirm: () => updateRetention(item.id, status) })}>{status}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      ) : null}

      {activeTab === "messages" ? (
        <div className="operation-grid">
          <article className="admin-card operation-panel">
            <PanelHead title="알림 생성" description="사용자에게 운영 알림을 발송 큐에 등록합니다." />
            <form className="operation-form" onSubmit={(event) => void createNotification(event)}>
              <input required value={notificationForm.user_id} onChange={(event) => setNotificationForm((current) => ({ ...current, user_id: event.target.value }))} placeholder="사용자 ID" />
              <select className="filter-select" value={notificationForm.channel} onChange={(event) => setNotificationForm((current) => ({ ...current, channel: event.target.value }))}>
                <option value="in_app">in_app</option>
                <option value="email">email</option>
                <option value="sms">sms</option>
              </select>
              <input required value={notificationForm.title} onChange={(event) => setNotificationForm((current) => ({ ...current, title: event.target.value }))} placeholder="제목" />
              <textarea required value={notificationForm.message} onChange={(event) => setNotificationForm((current) => ({ ...current, message: event.target.value }))} placeholder="메시지" />
              <button type="submit" className="action-button">알림 생성</button>
            </form>
            <OperationList items={notifications.data?.results.map((item) => ({ id: item.id, title: item.title, meta: `${item.user_email} · ${item.channel} · ${item.status}` })) ?? []} emptyText="알림 이력이 없습니다." />
          </article>
          <article className="admin-card operation-panel">
            <PanelHead title="정책 버전 게시" description="약관/개인정보 처리방침 버전을 등록하고 활성화합니다." />
            <form className="operation-form" onSubmit={requestPolicyPublish}>
              <select value={policyForm.policy_type} onChange={(event) => setPolicyForm((current) => ({ ...current, policy_type: event.target.value }))} className="filter-select">
                <option value="terms">이용약관</option>
                <option value="privacy">개인정보 처리방침</option>
              </select>
              <input required value={policyForm.version} onChange={(event) => setPolicyForm((current) => ({ ...current, version: event.target.value }))} placeholder="버전 예: 2026-05-19" />
              <input required value={policyForm.title} onChange={(event) => setPolicyForm((current) => ({ ...current, title: event.target.value }))} placeholder="정책 제목" />
              <textarea value={policyForm.body} onChange={(event) => setPolicyForm((current) => ({ ...current, body: event.target.value }))} placeholder="변경 요약 또는 전문" />
              <button type="submit" className="action-button danger">게시</button>
            </form>
            <OperationList items={policies.data?.slice(0, 5).map((item) => ({ id: item.id, title: item.title, meta: `${item.policy_type} · ${item.version} · ${item.is_active ? "활성" : "비활성"}` })) ?? []} emptyText="정책 버전이 없습니다." />
          </article>
        </div>
      ) : null}

      {activeTab === "audit" ? (
        <article className="admin-card operation-panel">
          <PanelHead title="감사 로그" description="관리자 조치 이력, 요청 ID, IP, 변경 전후 값을 확인합니다." />
          <div className="filter-row operation-toolbar">
            <input className="search-input" value={auditFilters.q} onChange={(event) => { setAuditPage(1); setAuditFilters((current) => ({ ...current, q: event.target.value })); }} placeholder="관리자, 대상, 사유, request id 검색" />
            <select className="filter-select" value={auditFilters.action} onChange={(event) => { setAuditPage(1); setAuditFilters((current) => ({ ...current, action: event.target.value })); }}>
              <option value="">전체 액션</option>
              <option value="user_update">user_update</option>
              <option value="content_moderation">content_moderation</option>
              <option value="report_update">report_update</option>
              <option value="retention_update">retention_update</option>
              <option value="notification_create">notification_create</option>
              <option value="job_retry">job_retry</option>
              <option value="job_cancel">job_cancel</option>
              <option value="policy_publish">policy_publish</option>
            </select>
            <input type="date" className="filter-select" value={auditFilters.created_from} onChange={(event) => { setAuditPage(1); setAuditFilters((current) => ({ ...current, created_from: event.target.value })); }} />
            <input type="date" className="filter-select" value={auditFilters.created_to} onChange={(event) => { setAuditPage(1); setAuditFilters((current) => ({ ...current, created_to: event.target.value })); }} />
          </div>
          {auditLogs.data ? (
            <>
              <div className="table-wrap">
                <table className="admin-table compact">
                  <thead><tr><th>시간</th><th>액션</th><th>대상</th><th>관리자</th><th>사유</th><th>상세</th></tr></thead>
                  <tbody>
                    {auditLogs.data.results.length === 0 ? <EmptyTableRow colSpan={6} message="감사 로그가 없습니다." /> : auditLogs.data.results.map((log) => (
                      <tr key={log.id}>
                        <td>{log.created_at}</td>
                        <td>{log.action}</td>
                        <td>{log.target_type}:{log.target_id}</td>
                        <td>{log.actor_email || "-"}</td>
                        <td>{log.reason || "-"}</td>
                        <td><button type="button" className="table-link" onClick={() => setSelectedLog(log)}>보기</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={auditLogs.data.page} totalPages={auditLogs.data.total_pages} totalCount={auditLogs.data.total_count} onPrev={() => setAuditPage((page) => Math.max(1, page - 1))} onNext={() => setAuditPage((page) => Math.min(auditLogs.data?.total_pages ?? page, page + 1))} />
            </>
          ) : null}
        </article>
      ) : null}

      {selectedReport ? <ReportDrawer report={selectedReport} onClose={() => setSelectedReport(null)} /> : null}
      {selectedLog ? <AuditDrawer log={selectedLog} onClose={() => setSelectedLog(null)} /> : null}
      {confirmAction ? <ConfirmDialog action={confirmAction} onCancel={() => setConfirmAction(null)} onConfirm={() => void runConfirmed()} /> : null}
    </SectionLayout>
  );
}

function compactParams(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== ""));
}

function TabButton({ label, value, activeTab, onChange }: { label: string; value: OperationsTab; activeTab: OperationsTab; onChange: (value: OperationsTab) => void }) {
  return <button type="button" className={`operation-tab ${activeTab === value ? "active" : ""}`} onClick={() => onChange(value)}>{label}</button>;
}

function Metric({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button type="button" className="metric-card is-clickable" onClick={onClick}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </button>
  );
}

function PanelHead({ title, description }: { title: string; description: string }) {
  return <div className="panel-head"><h2>{title}</h2><p>{description}</p></div>;
}

function ProgressCell({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="job-progress-cell">
      <div className="job-progress-meta"><strong>{progress}%</strong></div>
      <div className="job-progress-track"><div className="job-progress-fill" style={{ width: `${progress}%` }} /></div>
      <span className="job-progress-message">{message}</span>
    </div>
  );
}

function ModerationPanel({ data }: { data: PaginatedResponse<ModerationCase> | null }) {
  return (
    <article className="admin-card operation-panel">
      <PanelHead title="최근 수동 심사" description="관리자가 직접 변경한 판정 이력입니다." />
      <OperationList items={data?.results.map((item) => ({ id: item.id, title: item.file_name, meta: `${item.action} · ${item.previous_decision || "-"} -> ${item.next_decision || "-"} · ${item.actor_email || "-"}` })) ?? []} emptyText="수동 심사 이력이 없습니다." />
    </article>
  );
}

function LatestActionsPanel({ actions, onSelect }: { actions: AdminActionLog[]; onSelect: (log: AdminActionLog) => void }) {
  return (
    <article className="admin-card operation-panel">
      <PanelHead title="최근 관리자 액션" description="감사 로그에서 최근 변경을 빠르게 확인합니다." />
      <div className="operation-list">
        {actions.length === 0 ? <div className="empty-card">최근 액션이 없습니다.</div> : actions.map((item) => (
          <button type="button" className="operation-list-button" key={item.id} onClick={() => onSelect(item)}>
            <strong>{item.action}</strong><span>{item.actor_email || "-"} · {item.target_type}:{item.target_id}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function ReportQueuePanel({ reports, onOpen }: { reports: ReportCase[]; onOpen: (report: ReportCase) => void }) {
  return (
    <article className="admin-card operation-panel">
      <PanelHead title="신고 처리 큐" description="먼저 열어볼 신고와 이의제기입니다." />
      <div className="operation-list">
        {reports.slice(0, 5).map((item) => (
          <button type="button" className="operation-list-button" key={item.id} onClick={() => onOpen(item)}>
            <strong>{item.title}</strong><span>{item.status} · {item.file_name}</span>
          </button>
        ))}
        {reports.length === 0 ? <div className="empty-card">처리할 신고가 없습니다.</div> : null}
      </div>
    </article>
  );
}

function JobQueuePanel({ jobs, onOpenJobs }: { jobs: OperationJob[]; onOpenJobs: () => void }) {
  return (
    <article className="admin-card operation-panel">
      <PanelHead title="Job 큐" description="실패 또는 확인이 필요한 AI 작업입니다." />
      <OperationList items={jobs.slice(0, 5).map((item) => ({ id: item.job_id, title: `${item.job_type} · ${item.status}`, meta: item.error_code || item.error_message || item.owner_email }))} emptyText="확인할 Job이 없습니다." />
      <button type="button" className="ghost-button full-width" onClick={onOpenJobs}>Job 전체 보기</button>
    </article>
  );
}

function OperationList({ items, emptyText }: { items: Array<{ id: string | number; title: string; meta: string }>; emptyText: string }) {
  return (
    <div className="operation-list">
      {items.length === 0 ? <div className="empty-card">{emptyText}</div> : items.map((item) => (
        <div key={item.id}><strong>{item.title}</strong><span>{item.meta}</span></div>
      ))}
    </div>
  );
}

function ReportDrawer({ report, onClose }: { report: ReportCase; onClose: () => void }) {
  return (
    <aside className="operation-drawer" role="dialog" aria-modal="true" aria-label="신고 상세">
      <div className="drawer-head"><h2>{report.title}</h2><button type="button" className="ghost-button" onClick={onClose}>닫기</button></div>
      <dl className="detail-list compact">
        <div><dt>상태</dt><dd><StatusPill value={report.status} /></dd></div>
        <div><dt>유형</dt><dd>{report.report_type}</dd></div>
        <div><dt>신고자</dt><dd>{report.reporter_email || "익명"}</dd></div>
        <div><dt>담당자</dt><dd>{report.assignee_email || "-"}</dd></div>
        <div><dt>대상</dt><dd><NavLink to={`/images/${report.content_public_id}`}>{report.file_name}</NavLink></dd></div>
        <div><dt>내용</dt><dd>{report.description}</dd></div>
        <div><dt>증거</dt><dd><pre className="json-block">{JSON.stringify(report.evidence ?? {}, null, 2)}</pre></dd></div>
        <div><dt>처리</dt><dd>{report.resolution || "-"}</dd></div>
      </dl>
    </aside>
  );
}

function AuditDrawer({ log, onClose }: { log: AdminActionLog; onClose: () => void }) {
  return (
    <aside className="operation-drawer" role="dialog" aria-modal="true" aria-label="감사 로그 상세">
      <div className="drawer-head"><h2>{log.action}</h2><button type="button" className="ghost-button" onClick={onClose}>닫기</button></div>
      <dl className="detail-list compact">
        <div><dt>대상</dt><dd>{log.target_type}:{log.target_id}</dd></div>
        <div><dt>관리자</dt><dd>{log.actor_email || "-"}</dd></div>
        <div><dt>Request</dt><dd>{log.request_id || "-"}</dd></div>
        <div><dt>IP</dt><dd>{log.ip_address || "-"}</dd></div>
        <div><dt>사유</dt><dd>{log.reason || "-"}</dd></div>
        <div><dt>Before</dt><dd><pre className="json-block">{JSON.stringify(log.before ?? {}, null, 2)}</pre></dd></div>
        <div><dt>After</dt><dd><pre className="json-block">{JSON.stringify(log.after ?? {}, null, 2)}</pre></dd></div>
      </dl>
    </aside>
  );
}

function ConfirmDialog({ action, onCancel, onConfirm }: { action: ConfirmAction; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-label={action.title}>
        <h2>{action.title}</h2>
        <p>{action.body}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>취소</button>
          <button type="button" className={`action-button ${action.danger ? "danger" : ""}`} onClick={onConfirm}>{action.confirmText}</button>
        </div>
      </section>
    </div>
  );
}
