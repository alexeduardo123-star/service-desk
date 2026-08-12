import { STATUS_LABEL, STATUS_COR } from "../constants/labels";

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COR[status]}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
