/**
 * Environment utilities.
 */

/**
 * Extract environment for the trigger lambda.
 */
interface TriggerEnvironment {
  aws: {
    region: string
  }
  ecs: {
    clusterName: string
    taskDefinition: string
    containerName: string
  }
  vpc: {
    subnets: string[]
    securityGroup: string
  }
}
export function getTriggerEnv(): TriggerEnvironment {
  // Get environment variables.
  const AWS_REGION = process.env.AWS_REGION
  const ECS_CLUSTER_NAME = process.env.ECS_CLUSTER_NAME
  const ECS_TASK_DEFINITION = process.env.ECS_TASK_DEFINITION
  const ECS_CONTAINER_NAME = process.env.ECS_CONTAINER_NAME
  const VPC_SUBNETS = process.env.VPC_SUBNETS?.split(",")
  const VPC_SECURITY_GROUP = process.env.VPC_SECURITY_GROUP
  // Throw if missing any variables.
  if (
    !AWS_REGION ||
    !ECS_CLUSTER_NAME ||
    !ECS_TASK_DEFINITION ||
    !ECS_CONTAINER_NAME ||
    !VPC_SUBNETS ||
    !VPC_SECURITY_GROUP
  ) {
    throw new Error("Missing configuration.")
  }
  // Return the environment object.
  return {
    aws: {
      region: AWS_REGION,
    },
    ecs: {
      clusterName: ECS_CLUSTER_NAME,
      taskDefinition: ECS_TASK_DEFINITION,
      containerName: ECS_CONTAINER_NAME,
    },
    vpc: {
      subnets: VPC_SUBNETS,
      securityGroup: VPC_SECURITY_GROUP,
    },
  }
}

/**
 * Extract environment for the ECS worker.
 */
interface WorkerEnvironment {
  body: string
  id: string
}
export function getWorkerEnv(): WorkerEnvironment {
  // Get environment variables.
  const TASK_MESSAGE_BODY = process.env.TASK_MESSAGE_BODY
  const TASK_MESSAGE_ID = process.env.TASK_MESSAGE_ID
  // Throw if missing any variables.
  if (!TASK_MESSAGE_BODY || !TASK_MESSAGE_ID) {
    throw new Error("Missing configuration.")
  }
  // Return the environment object.
  return {
    body: TASK_MESSAGE_BODY,
    id: TASK_MESSAGE_ID,
  }
}
