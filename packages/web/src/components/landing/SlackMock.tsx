import {
  BORDER,
  BotHeader,
  GREEN_CHECK,
  LINK_COLOR,
  ORANGE_DOT,
  SidebarItem,
  SlackShell,
  TEXT_DIM,
  TEXT_MUTED,
  TEXT_PRIMARY,
  ViewButton,
} from "./slack-mock-shared";

function Avatar({
  color,
  letter,
}: {
  color: string;
  letter: string;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded text-[9px] font-bold text-white shrink-0"
      style={{ backgroundColor: color, width: 16, height: 16 }}
    >
      {letter}
    </span>
  );
}

function RepoInfo({
  repo,
  author,
  authorColor,
  additions,
  deletions,
  branch,
}: {
  repo: string;
  author: string;
  authorColor: string;
  additions: string;
  deletions: string;
  branch: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
      <span className="flex items-center gap-1">
        <span style={{ color: TEXT_MUTED }}>&#x1F4E6;</span>
        <span style={{ color: TEXT_PRIMARY }}>{repo}</span>
      </span>
      <Avatar color={authorColor} letter={author[0]} />
      <span style={{ color: LINK_COLOR }}>@{author}</span>
      <span style={{ color: GREEN_CHECK }}>+{additions}</span>
      <span style={{ color: "#e01e5a" }}>-{deletions}</span>
      <span
        className="flex items-center gap-0.5"
        style={{ color: "#e8912d" }}
      >
        <span className="text-[8px]">&#x1F33F;</span>
        {branch}
      </span>
    </div>
  );
}

function StatusBadge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-[11px]"
      style={{ color: TEXT_PRIMARY }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

function PrMessage({
  title,
  description,
  repo,
  author,
  authorColor,
  additions,
  deletions,
  branch,
  statuses,
  openedBy,
}: {
  title: string;
  description: string;
  repo: string;
  author: string;
  authorColor: string;
  additions: string;
  deletions: string;
  branch: string;
  statuses: { icon: React.ReactNode; text: string }[];
  openedBy: string;
}) {
  return (
    <div className="flex gap-2">
      <img
        src="/review_corral_logo-min.png"
        alt=""
        className="w-8 h-8 rounded mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <BotHeader time="12:03 PM" />
        <p
          className="text-[11px] mb-1"
          style={{ color: TEXT_MUTED }}
        >
          Pull request opened by{" "}
          <span style={{ color: LINK_COLOR }}>@{openedBy}</span>
        </p>

        <div
          className="rounded-lg p-3 mb-2"
          style={{
            backgroundColor: "#222529",
            border: `1px solid ${BORDER}`,
          }}
        >
          <h4
            className="text-[13px] font-bold mb-1"
            style={{ color: TEXT_PRIMARY }}
          >
            {title}
          </h4>
          <ViewButton />
          <p
            className="text-[11px] mt-2 mb-2 leading-relaxed"
            style={{ color: TEXT_MUTED }}
          >
            {description}
          </p>
          <RepoInfo
            repo={repo}
            author={author}
            authorColor={authorColor}
            additions={additions}
            deletions={deletions}
            branch={branch}
          />
        </div>

        <div className="flex flex-col gap-0.5">
          {statuses.map((s, i) => (
            <StatusBadge key={i} icon={s.icon} text={s.text} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SlackMock() {
  return (
    <SlackShell
      sidebar={
        <>
          <div className="flex flex-col gap-0.5 px-1 py-1">
            <SidebarItem icon="&#x1F4AC;" label="Threads" />
            <SidebarItem icon="&#x1F3A7;" label="Huddles" />
            <SidebarItem
              icon="&#x1F4E8;"
              label="Drafts & sent"
            />
          </div>
          <div
            className="px-3 mt-2 mb-1 text-[11px]"
            style={{ color: TEXT_DIM }}
          >
            Channels
          </div>
          <div className="flex flex-col gap-0.5 px-1">
            <SidebarItem
              icon="#"
              label="pull-requests"
              active
              badge={24}
            />
          </div>
          <div
            className="px-3 mt-2 mb-1 text-[11px]"
            style={{ color: TEXT_DIM }}
          >
            Direct Messages
          </div>
        </>
      }
      header={
        <span
          className="text-[13px] font-bold"
          style={{ color: TEXT_PRIMARY }}
        >
          # pull-requests
        </span>
      }
    >
      <PrMessage
        title="Add 'Dundie Awards' recipients to marketing site #340"
        description="Adds a new page to the marketing site showcasing the 2024 Dundie Award winners."
        repo="Dunder Mifflin"
        author="jim"
        authorColor="#4a90d9"
        additions="432"
        deletions="12"
        branch="main"
        openedBy="jim"
        statuses={[
          {
            icon: (
              <span style={{ color: GREEN_CHECK }}>&#x2705;</span>
            ),
            text: "2/2 approvals met",
          },
          {
            icon: (
              <span style={{ color: ORANGE_DOT }}>&#x1F7E0;</span>
            ),
            text: "Queued to merge",
          },
        ]}
      />
      <PrMessage
        title="Update Regional Manager Guidelines #341"
        description="Updates the guidelines document with new Scranton branch policies."
        repo="Dunder Mifflin"
        author="Michael"
        authorColor="#e8912d"
        additions="200"
        deletions="50"
        branch="main"
        openedBy="Michael"
        statuses={[
          {
            icon: (
              <span style={{ color: GREEN_CHECK }}>
                &#x2611;&#xFE0F;
              </span>
            ),
            text: "1/2 approvals met",
          },
        ]}
      />
    </SlackShell>
  );
}
