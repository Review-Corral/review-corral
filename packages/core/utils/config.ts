import {
  getCurrentBranchName,
  getDebugMode,
  getFriendlyNameAndEnvironment,
  getFrontendUrl,
  getIsLocal,
  getReleaseVersion,
} from "./lambda/helpers";

const { environment, friendlyName: functionName } =
  getFriendlyNameAndEnvironment();
const isLocal = getIsLocal();

const config = {
  region: "us-east-1",
  appName: "review-corral",
  isLocal,
  isCI: !!process.env.CI,
  debugMode: getDebugMode(),
  frontendBaseUrl: getFrontendUrl(),
  environment,
  functionName,
  releaseVersion: getReleaseVersion(),
  branchName: isLocal ? getCurrentBranchName() : "N/A",
  verboseLogging: {
    rowMatching: !!process.env["VERBOSE_LOGGING_ROW_MATCHING"],
  },
};

export type BackendConfig = typeof config;

export default config;
