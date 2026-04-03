import {
  BORDER,
  BotHeader,
  LINK_COLOR,
  SidebarItem,
  SlackShell,
  TEXT_DIM,
  TEXT_MUTED,
  TEXT_PRIMARY,
  ViewButton,
} from "./slack-mock-shared";

function DmNotification({
  eventText,
  prTitle,
  comment,
  time,
}: {
  eventText: React.ReactNode;
  prTitle: string;
  comment?: string;
  time: string;
}) {
  return (
    <div className="flex gap-2">
      <img
        src="/review_corral_logo-min.png"
        alt=""
        className="w-8 h-8 rounded mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <BotHeader time={time} />
        <p
          className="text-[11px] mb-1"
          style={{ color: TEXT_MUTED }}
        >
          {eventText}
        </p>

        <div
          className="rounded-lg p-3"
          style={{
            backgroundColor: "#222529",
            border: `1px solid ${BORDER}`,
          }}
        >
          <h4
            className="text-[13px] font-bold mb-1"
            style={{ color: TEXT_PRIMARY }}
          >
            {prTitle}
          </h4>
          <ViewButton />
          {comment && (
            <p
              className="text-[11px] mt-2 leading-relaxed"
              style={{ color: TEXT_MUTED }}
            >
              {comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SlackDmMock() {
  return (
    <SlackShell
      height={520}
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
            <SidebarItem icon="#" label="pull-requests" />
          </div>
          <div
            className="px-3 mt-2 mb-1 text-[11px]"
            style={{ color: TEXT_DIM }}
          >
            Direct Messages
          </div>
          <div className="flex flex-col gap-0.5 px-1">
            <SidebarItem
              icon="&#x1F916;"
              label="Review Corral"
              active
            />
          </div>
        </>
      }
      header={
        <div className="flex items-center gap-2">
          <img
            src="/review_corral_logo-min.png"
            alt=""
            className="w-5 h-5 rounded shrink-0"
          />
          <span
            className="text-[13px] font-bold"
            style={{ color: TEXT_PRIMARY }}
          >
            Review Corral
          </span>
        </div>
      }
    >
      <DmNotification
        time="10:15 AM"
        eventText="You've been requested to review"
        prTitle="Add beet farming integration #342"
      />
      <DmNotification
        time="11:34 AM"
        eventText={
          <>
            <span style={{ color: LINK_COLOR }}>@Dwight</span>
            {" mentioned you in a comment"}
          </>
        }
        prTitle="Add 'Dundie Awards' recipients to marketing site #340"
        comment="Hey @Jim, can you take a look at this section? I think we need your input."
      />
      <DmNotification
        time="11:52 AM"
        eventText={
          <>
            {"Your PR was "}
            <span style={{ color: "#2eb67d" }}>merged</span>
          </>
        }
        prTitle="Add 'Dundie Awards' recipients to marketing site #340"
      />
      <DmNotification
        time="12:01 PM"
        eventText={
          <>
            <span style={{ color: LINK_COLOR }}>@Michael</span>
            {" approved your pull request"}
          </>
        }
        prTitle="Update Regional Manager Guidelines #341"
      />
      <DmNotification
        time="12:14 PM"
        eventText="A new comment was added to your PR"
        prTitle="Fix Scranton branch inventory sync #339"
        comment="Looks good, just one nit on the error handling in the retry loop."
      />
    </SlackShell>
  );
}
