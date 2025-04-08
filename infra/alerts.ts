// Create an SNS topic for Lambda error alerts
const alertTopic = new sst.aws.SnsTopic("lambda-error-alerts");

// Subscribe an email address to the SNS Topic
new aws.sns.TopicSubscription("emailSubscription", {
  topic: alertTopic.arn,
  protocol: "email",
  endpoint: "alex.mclean25+rc-alerts@gmail.com",
});

// Create a CloudWatch alarm that triggers when any Lambda has errors
const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm("lambda-errors", {
  namespace: "AWS/Lambda",
  metricName: "Errors",
  // This will monitor all Lambda functions in the account
  dimensions: {},
  statistic: "Sum",
  period: 60, // 1 minute
  threshold: 1, // Any error triggers the alarm
  evaluationPeriods: 1,
  comparisonOperator: "GreaterThanOrEqualToThreshold",
  treatMissingData: "notBreaching",
  alarmActions: [alertTopic.arn],
});

export { alertTopic, lambdaErrorAlarm };
