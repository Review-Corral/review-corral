export default async function OrgView({
  params,
}: {
  params: { orgId: string };
}) {
  const orgId = params.orgId;
  return (
    <>
      <div className="text-xl">Repositories</div>;
      <div>This is the org view for orgId: {orgId}</div>
      <div>Loading: {false ? "true" : "false"}</div>
    </>
  );
}
