/**
 * Task code.
 */

// Utility imports.
import { logger } from "@utils/logger"

/**
 * Task function.
 */
export const task: TaskFunction = async ({ body }) => {
  // Log the message.
  logger.info(body.message)
}
