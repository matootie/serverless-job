/**
 * Task entrypoint.
 */

// Task import.
import { task } from "@task"

// Utility imports.
import { getWorkerEnv } from "@utils/environment"
import { validate } from "@utils/validation"
import { logger } from "@utils/logger"

/**
 * Function to start the task.
 */
async function run() {
  // Get the necessary environment variables.
  const environment = getWorkerEnv()
  // Validate the message body.
  const body = validate(environment.body)
  // Run the task function.
  await task({ body, id: environment.id })
}

// Setup, run the task, catch and log any errors.
run().catch(logger.error)
