/**
 * Trigger entrypoint.
 */

// External imports.
import { SQSBatchItemFailure, SQSHandler, SQSRecord } from "aws-lambda"
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"

// Utility imports.
import { validate } from "@utils/validation"
import { getTriggerEnv } from "@utils/environment"
import { logger } from "@utils/logger"

/**
 * Fetch cached ECS client or create a new one.
 */
let _cachedECSClient: ECSClient | undefined
function getECSClient(region: string): ECSClient {
  if (!_cachedECSClient) {
    _cachedECSClient = new ECSClient({ region })
  }
  return _cachedECSClient
}

/**
 * Trigger function.
 */
async function trigger(record: SQSRecord) {
  // Validate the message body.
  validate(record.body)
  // Get the necessary environment variables.
  const environment = getTriggerEnv()
  // Get the ECS client.
  const ecs = getECSClient(environment.aws.region)
  // Log that the task is about to start.
  logger.info("Starting ECS task...")
  // Run the task.
  const result = await ecs.send(
    new RunTaskCommand({
      cluster: environment.ecs.clusterName,
      launchType: "FARGATE",
      taskDefinition: environment.ecs.taskDefinition,
      count: 1,
      platformVersion: "LATEST",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: environment.vpc.subnets,
          securityGroups: [environment.vpc.securityGroup],
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: environment.ecs.containerName,
            environment: [
              {
                name: "TASK_MESSAGE_BODY",
                value: record.body,
              },
              {
                name: "TASK_MESSAGE_ID",
                value: record.messageId,
              },
            ],
          },
        ],
      },
    }),
  )
  // Throw if there are any failures.
  if (result.failures && result.failures.length > 0) {
    throw result.failures
  }
  // Log that the task has been started.
  logger.info("Successfully started ECS task.")
}

/**
 * Lambda handler.
 */
export const handler: SQSHandler = async (event) => {
  // Initialize a new array to keep track of failures.
  const fails: SQSBatchItemFailure[] = []
  // For every record in the event, trigger the task.
  for (const record of event.Records) {
    try {
      // Attempt to trigger the task.
      await trigger(record)
    } catch (error) {
      // Log the error.
      logger.error(error)
      // Add the message to list of failed.
      fails.push({
        itemIdentifier: record.messageId,
      })
    }
  }
  // Report any failures.
  if (fails.length > 0) {
    return {
      batchItemFailures: fails,
    }
  }
}
