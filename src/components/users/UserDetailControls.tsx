type UserDetailControlsProps = {
  roleValue: string;
  statusValue: string;
  currentRole: string;
  currentStatus: string;
  savingRole: boolean;
  savingStatus: boolean;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSaveRole: () => void;
  onSaveStatus: () => void;
  saveError: string;
  saveMessage: string;
};

export function UserDetailControls({
  roleValue,
  statusValue,
  currentRole,
  currentStatus,
  savingRole,
  savingStatus,
  onRoleChange,
  onStatusChange,
  onSaveRole,
  onSaveStatus,
  saveError,
  saveMessage,
}: UserDetailControlsProps) {
  return (
    <>
      <div className="control-grid">
        <div className="control-panel">
          <label>권한 변경</label>
          <div className="inline-controls">
            <select className="filter-select" value={roleValue} onChange={(event) => onRoleChange(event.target.value)}>
              <option value="일반회원">일반회원</option>
              <option value="관리자">관리자</option>
            </select>
            <button className="action-button secondary" onClick={onSaveRole} disabled={savingRole || roleValue === currentRole}>
              {savingRole ? "저장 중..." : "권한 저장"}
            </button>
          </div>
        </div>
        <div className="control-panel">
          <label>계정 상태 변경</label>
          <div className="inline-controls">
            <select className="filter-select" value={statusValue} onChange={(event) => onStatusChange(event.target.value)}>
              <option value="정상">정상</option>
              <option value="정지">정지</option>
            </select>
            <button className="action-button secondary" onClick={onSaveStatus} disabled={savingStatus || statusValue === currentStatus}>
              {savingStatus ? "저장 중..." : "상태 저장"}
            </button>
          </div>
        </div>
      </div>

      {saveError ? <p className="control-feedback is-error">{saveError}</p> : null}
      {saveMessage ? <p className="control-feedback is-success">{saveMessage}</p> : null}
    </>
  );
}
