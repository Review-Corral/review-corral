ALTER TABLE slack_integration ALTER COLUMN channel_id SET NOT NULL;

ALTER TABLE slack_integration ALTER COLUMN slack_team_name SET NOT NULL;

ALTER TABLE slack_integration ALTER COLUMN slack_team_id SET NOT NULL;

ALTER TABLE slack_integration ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE slack_integration ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE slack_integration ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE slack_integration ALTER COLUMN access_token SET NOT NULL;