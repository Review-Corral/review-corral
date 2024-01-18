import { Organization } from "@core/db/types";

export interface OrgViewProps {
  organization: Organization;
  /**
   * When clicking edit, the action to take. Provides the page since it's often we
   * navigate to a new page to edit.
   */
}
