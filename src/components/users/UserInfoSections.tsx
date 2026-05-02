import { DetailCard, DetailList } from "../common/DetailPrimitives";
import type { AdminUserDetail } from "../../types/admin";

export function UserInfoSections({ user }: { user: AdminUserDetail }) {
  return (
    <div className="detail-grid">
      <DetailCard title="기본 정보">
        <DetailList
          items={[
            { label: "이메일", value: user.email },
            { label: "닉네임", value: user.nickname },
            { label: "권한", value: user.role },
            { label: "유저 ID", value: user.id },
            { label: "가입일", value: user.joined_at },
            { label: "마지막 로그인", value: user.last_login },
            { label: "최근 로그인 IP", value: user.recent_ip || "-" },
          ]}
        />
      </DetailCard>

      <DetailCard title="인증/권한 정보">
        <DetailList
          items={[
            { label: "SMS 인증", value: user.sms_verification },
            { label: "이메일 인증", value: user.email_verification },
            { label: "보유 NFT", value: user.nft_count == null ? "-" : `${user.nft_count}개` },
            { label: "투표 권한", value: user.vote_permission },
            { label: "계정 상태", value: user.status },
          ]}
        />
      </DetailCard>

      <DetailCard title="연결된 지갑 정보">
        <DetailList
          items={[
            { label: "지갑 주소", value: user.wallet_address || "-" },
            { label: "연결 방식", value: user.wallet_method || "-" },
            { label: "연결일", value: user.wallet_linked_at || "-" },
          ]}
        />
      </DetailCard>
    </div>
  );
}
