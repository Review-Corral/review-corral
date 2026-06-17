export const DARK_BG = "#1a1d21";
export const SIDEBAR_BG = "#19171d";
export const CHANNEL_ACTIVE = "#1264a3";
export const TEXT_PRIMARY = "#d1d2d3";
export const TEXT_MUTED = "#9a9b9d";
export const TEXT_DIM = "#6b6c6e";
export const BORDER = "#35373b";
export const LINK_COLOR = "#1d9bd1";
export const GREEN_CHECK = "#2eb67d";
export const ORANGE_DOT = "#e8912d";

export function Tag({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${color}22`,
        color,
      }}
    >
      {children}
    </span>
  );
}

export function ViewButton() {
  return (
    <button
      type="button"
      className="rounded border px-3 py-0.5 text-[11px] font-medium"
      style={{
        borderColor: BORDER,
        color: TEXT_PRIMARY,
        backgroundColor: "transparent",
      }}
    >
      View
    </button>
  );
}

export function BotHeader({ time }: { time: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[13px] font-bold"
        style={{ color: TEXT_PRIMARY }}
      >
        Review Corral
      </span>
      <Tag color="#7c7e82">APP</Tag>
      <span className="text-[10px]" style={{ color: TEXT_DIM }}>
        {time}
      </span>
    </div>
  );
}

export function SidebarItem({
  icon,
  label,
  active,
  badge,
  bold,
}: {
  icon?: string;
  label: string;
  active?: boolean;
  badge?: number;
  bold?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-0.5 rounded text-[12px] cursor-default"
      style={{
        backgroundColor: active ? CHANNEL_ACTIVE : "transparent",
        color: active ? "#fff" : TEXT_MUTED,
        fontWeight: bold ? 700 : 400,
      }}
    >
      {icon && <span className="text-[11px]">{icon}</span>}
      <span className="truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="ml-auto rounded-full px-1.5 text-[10px] font-bold"
          style={{
            backgroundColor: "#e01e5a",
            color: "#fff",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function SlackShell({
  sidebar,
  header,
  children,
  height = 420,
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl text-left select-none w-full max-w-lg"
      style={{
        backgroundColor: DARK_BG,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div className="flex" style={{ height }}>
        {/* Sidebar */}
        <div
          className="w-[140px] shrink-0 flex flex-col py-2 overflow-hidden"
          style={{
            backgroundColor: SIDEBAR_BG,
            borderRight: `1px solid ${BORDER}`,
          }}
        >
          <div
            className="px-3 pb-2 mb-1 flex items-center gap-1.5"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <span
              className="text-[13px] font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              Dunder Mifflin
            </span>
          </div>
          {sidebar}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="px-4 py-2 flex items-center gap-2"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            {header}
          </div>
          <div className="flex-1 overflow-hidden px-4 py-3 flex flex-col gap-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
