type UsersFilterBarProps = {
  query: string;
  filter: string;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: string) => void;
};

export function UsersFilterBar({ query, filter, onQueryChange, onFilterChange }: UsersFilterBarProps) {
  return (
    <div className="filter-stack">
      <div className="search-row">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="search-input"
          placeholder="ID, 이메일, 닉네임 검색..."
        />
        <button className="action-button">검색</button>
      </div>
      <div className="filter-row">
        <select value={filter} onChange={(event) => onFilterChange(event.target.value)} className="filter-select">
          <option>전체 회원</option>
          <option>관리자</option>
          <option>정상</option>
          <option>정지</option>
        </select>
        <button className="action-button secondary">적용</button>
      </div>
    </div>
  );
}
