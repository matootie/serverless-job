import { QueueMessageBody } from "@utils/validation"

declare global {
  interface TaskFunctionOptions {
    body: QueueMessageBody
    id: string
  }
  type TaskFunction = (options: TaskFunctionOptions) => Promise<void> | void
}
