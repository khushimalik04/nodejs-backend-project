/**
 * New Task Interface
 * Defines the structure for creating a new task.
 * Includes properties such as title, description, status, and timestamps.
 * All fields are required except for description, startTime, endTime, and calendarEventId which can be null.
 * Note: All timestamp fields are stored as strings in IST timezone format.
 * @interface INewTask
 * @property {string} id - Unique identifier for the task
 * @property {string} createdAt - Timestamp when the task was created (IST format)
 * @property {string} updatedAt - Timestamp when the task was last updated (IST format)
 * @property {string | null} description - Description of the task
 * @property {string} userId - Identifier of the user who owns the task
 * @property {string} title - Title of the task
 * @property {string} status - Current status of the task
 * @property {string | null} startTime - Start time of the task (IST format)
 * @property {string | null} endTime - End time of the task (IST format)
 * @property {string | null} calendarEventId - Associated calendar event ID
 */
export interface INewTask {
  id: string;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  userId: string;
  title: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  calendarEventId: string | null;
}

/**
 * Update Task Interface
 * Defines the structure for updating an existing task.
 * All fields are required except for description, startTime, endTime, and calendarEventId which can be null.
 * Note: All timestamp fields are stored as strings in IST timezone format.
 * @interface IUpdateTask
 * @property {string} id - Unique identifier for the task
 * @property {string} userId - Identifier of the user who owns the task
 * @property {string} title - Title of the task
 * @property {string | null} description - Description of the task
 * @property {string} status - Current status of the task
 * @property {string | null} startTime - Start time of the task (IST format)
 * @property {string | null} endTime - End time of the task (IST format)
 * @property {string | null} calendarEventId - Associated calendar event ID
 * @property {string} createdAt - Timestamp when the task was created (IST format)
 * @property {string} updatedAt - Timestamp when the task was last updated (IST format)
 */
export interface IUpdateTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  startTime: string | null;
  endTime: string | null;
  calendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
}
