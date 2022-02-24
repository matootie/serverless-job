/**
 * AWS CDK stack definition.
 */

// CDK imports.
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib"
import { Construct } from "constructs"

// EC2 imports.
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2"

// ECS imports.
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
} from "aws-cdk-lib/aws-ecs"

// SQS imports.
import { Queue } from "aws-cdk-lib/aws-sqs"

// Lambda imports.
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda"
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources"

// IAM imports.
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam"

// Logs imports.
import { RetentionDays } from "aws-cdk-lib/aws-logs"

/**
 * The AWS CDK stack.
 */
export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Configure the execution role.
    const role = new Role(this, "ExecutionRole", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    })

    // Configure the VPC.
    const vpc = new Vpc(this, "VPC", {
      cidr: "10.0.0.0/23",
      natGateways: 0,
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public",
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
      ],
    })

    // Configure the ECS cluster.
    const cluster = new Cluster(this, "Cluster", {
      vpc,
      enableFargateCapacityProviders: true,
    })

    // Configure the task definition for the Fargate task.
    const taskDefinition = new FargateTaskDefinition(this, "TaskDefinition", {
      taskRole: role,
    })

    // Add the container to the task definition.
    const containerName = "worker"
    taskDefinition.addContainer(containerName, {
      image: ContainerImage.fromAsset("./", { file: "Dockerfile.task" }),
      logging: new AwsLogDriver({
        streamPrefix: "/aws/ecs/",
        logRetention: RetentionDays.ONE_YEAR,
      }),
    })

    // Configure the Queue.
    const queue = new Queue(this, "Queue")

    // Configure the Lambda trigger.
    const trigger = new DockerImageFunction(this, "Trigger", {
      code: DockerImageCode.fromImageAsset("./", {
        file: "Dockerfile.trigger",
      }),
      environment: {
        ECS_CLUSTER_NAME: cluster.clusterName,
        ECS_TASK_DEFINITION: taskDefinition.taskDefinitionArn,
        ECS_CONTAINER_NAME: containerName,
        VPC_SUBNETS: vpc.publicSubnets.map((s) => s.subnetId).join(","),
        VPC_SECURITY_GROUP: vpc.vpcDefaultSecurityGroup,
      },
    })

    // Give the trigger Lambda the ability to run the ECS task.
    trigger.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ecs:runTask"],
        resources: [taskDefinition.taskDefinitionArn],
      }),
    )

    // Give the trigger Lambda the ability to pass role permissions.
    trigger.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["iam:Passrole"],
        resources: [
          taskDefinition.taskRole.roleArn,
          taskDefinition.executionRole?.roleArn || "",
        ],
      }),
    )

    // Bind the trigger Lambda to the SQS queue.
    trigger.addEventSource(new SqsEventSource(queue))

    // Set outputs for the stack.
    new CfnOutput(this, "WorkerExecutionRoleArn", {
      value: role.roleArn,
      description: "Role that the ECS worker uses during execution.",
      exportName: "workerExecutionRoleArn",
    })
    new CfnOutput(this, "WorkerQueueUrl", {
      value: queue.queueUrl,
      description: "URL of the queue for which the worker responds to events.",
      exportName: "workerQueueUrl",
    })
    new CfnOutput(this, "WorkerQueueArn", {
      value: queue.queueArn,
      description: "ARN of the queue for which the worker responds to events.",
      exportName: "workerQueueArn",
    })
  }
}
