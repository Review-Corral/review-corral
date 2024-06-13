import { Organization } from "@core/dynamodb/entities/types";
import { Page } from "../OrgView";

export interface OrgViewProps {
  organization: Organization;
  /**
   * When clicking edit, the action to take. Provides the page since it's often we
   * navigate to a new page to edit.
   */
  onEdit: (page: Page) => void;
}
