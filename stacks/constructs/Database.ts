import { Duration } from "aws-cdk-lib";
import { ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { App, Topic } from "sst/constructs";

export interface DatabaseConnectionProps {
  host: string;
  port: string;
  engine: string;
  username: string;
  password: string;
}

interface Database {
  readonly endpoint: rds.Endpoint;
  readonly secret: secretsmanager.ISecret;
  allowInboundAccess: (peer: ec2.IPeer) => void;
}

const checkEnvSet = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }

  return value;
};

export const getDbConnectionInfo = (
  app: App,
  database?: Database
): Record<string, string> => {
  if (app.local || !database) {
    console.log("Using local database connection info");
    return {
      DB_HOST: checkEnvSet("DB_HOST"),
      DB_PORT: checkEnvSet("DB_PORT"),
      DB_NAME: checkEnvSet("DB_NAME"),
      DB_USER: checkEnvSet("DB_USER"),
      DB_PASSWORD: checkEnvSet("DB_PASSWORD"),
    };
  } else {
    console.log("Using remote database connection info: ", {
      secretArn: database.secret.secretArn,
    });
    return {
      DB_CREDENTIALS_SECRET_ARN: database.secret.secretArn,
    };
  }
};

interface ProvisionedDatabaseProps {
  isLocal: boolean;
  vpc: ec2.IVpc;
}

export default class ProvisionedDatabase extends Construct implements Database {
  readonly endpoint: rds.Endpoint;
  readonly instance: rds.DatabaseInstance;
  readonly secret: secretsmanager.ISecret;
  private readonly securityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: ProvisionedDatabaseProps) {
    super(scope, id);

    const vpc = props.vpc;

    const securityGroup = new ec2.SecurityGroup(this, "ClusterSecurityGroup", {
      vpc,
    });

    const instanceClass = ec2.InstanceClass.T4G;
    const instanceSize = ec2.InstanceSize.MICRO;
    const instanceVcpuCount = 1; // Keep this up to date with instance class and size

    const instance = new rds.DatabaseInstance(this, "PgDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of("13.12", "13"),
      }),
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnets: vpc.isolatedSubnets.concat(vpc.privateSubnets),
      }),
      instanceType: ec2.InstanceType.of(instanceClass, instanceSize),
      securityGroups: [securityGroup],
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT, // $0.00
      preferredMaintenanceWindow: "Mon:04:00-Mon:09:00", // 4am-9am UTC on Mondays = 11pm Sunday to 4am Monday EST (UTC-5)
      cloudwatchLogsExports: ["postgresql"],
      cloudwatchLogsRetention: RetentionDays.ONE_WEEK,
      monitoringInterval: Duration.seconds(60),
      removalPolicy: undefined,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
    });

    this.endpoint = instance.instanceEndpoint;
    this.instance = instance;
    this.secret = instance.secret!;
    this.securityGroup = securityGroup;

    if (!props.isLocal) {
      setDbUsageAlarm(this, instance, instanceVcpuCount);
    }
  }

  allowInboundAccess(peer: ec2.IPeer) {
    this.securityGroup.addIngressRule(peer, ec2.Port.tcp(this.endpoint.port));
  }
}

function setDbUsageAlarm(
  scope: Construct,
  instance: rds.DatabaseInstance,
  instanceVcpuCount: number
) {
  const topic = new Topic(scope, "DbAlarmTopic");
  topic.cdk.topic.addSubscription(
    new EmailSubscription("alex.mclean25+reviewcorral@gmail.com")
  );

  // Trigger an alarm when the average number of connections waiting for a CPU is
  // greater than the number of DB instance vCPUs over a 2 minute period. Frequent
  // alarms may indicate the need to upgrade to a larger DB instance size.
  const alarm = instance
    .metric("DBLoadCPU", { period: Duration.minutes(1), statistic: "Average" })
    .createAlarm(scope, "DbCpuLoadAlarm", {
      evaluationPeriods: 2,
      threshold: instanceVcpuCount,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

  alarm.addAlarmAction(new SnsAction(topic.cdk.topic));
}
