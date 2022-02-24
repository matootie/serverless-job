/**
 * Validation utilities.
 *
 * Used to validate JSON body of SQS messages.
 */

// External imports.
import { object, string, create, Infer } from "superstruct"

/**
 * Queue message schema.
 *
 * This represents the desired message format from the queue.
 * Messages received from the queue will be validated against
 * this schema.
 */
export const QueueMessageSchema = object({
  message: string(),
})

/**
 * Queue message body type.
 *
 * Exports a type to represent the queue message schema output.
 */
export type QueueMessageBody = Infer<typeof QueueMessageSchema>

/**
 * Validate a JSON string against the schema.
 */
export function validate(json: string): QueueMessageBody {
  // Parse the JSON string into an object.
  const data = JSON.parse(json)
  // Validate the object.
  const validated = create(data, QueueMessageSchema)
  // Return the object, typed accordingly.
  return validated
}
