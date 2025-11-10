/**
 * Task Management Routes
 *
 * Defines all RESTful endpoints for task management operations.
 * All routes require user authentication and email verification.
 * Implements comprehensive OpenAPI documentation for each endpoint.
 *
 * @module routes/task.routes
 * @requires express
 * @requires @/controllers/task.controller
 * @requires @/middleware/auth (assumed to be implemented)
 *
 * @author Development Team
 * @version 1.0.0
 */

import express, { type Router } from 'express';
import {
  createTaskWithValidation,
  getTasksWithValidation,
  getTaskByIdWithValidation,
  updateTaskWithValidation,
  deleteTaskWithValidation,
  getTaskStatsHandler,
} from '@/controllers/task.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router: Router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - title
 *         - status
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the task
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns the task
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Task title
 *           example: "Complete project documentation"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           description: Detailed task description
 *           example: "Write comprehensive API documentation for the task management system"
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           description: Current status of the task
 *           example: "pending"
 *         startTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled start time for the task
 *           example: "2024-10-25T09:00:00Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled end time for the task
 *           example: "2024-10-25T17:00:00Z"
 *         calendarEventId:
 *           type: string
 *           nullable: true
 *           description: Associated calendar event ID
 *           example: "calendar-event-123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Task creation timestamp
 *           example: "2024-10-22T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-10-22T10:30:00Z"
 *
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: Task title
 *           example: "Complete project documentation"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           description: Detailed task description
 *           example: "Write comprehensive API documentation"
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           default: pending
 *           description: Initial status of the task
 *           example: "pending"
 *         startTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled start time
 *           example: "2024-10-25T09:00:00Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled end time
 *           example: "2024-10-25T17:00:00Z"
 *         calendarEventId:
 *           type: string
 *           nullable: true
 *           description: Associated calendar event ID
 *           example: "calendar-event-123"
 *
 *     UpdateTaskRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: Updated task title
 *           example: "Updated project documentation"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           description: Updated task description
 *           example: "Updated comprehensive API documentation"
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           description: Updated task status
 *           example: "in_progress"
 *         startTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Updated start time
 *           example: "2024-10-25T10:00:00Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Updated end time
 *           example: "2024-10-25T18:00:00Z"
 *         calendarEventId:
 *           type: string
 *           nullable: true
 *           description: Updated calendar event ID
 *           example: "calendar-event-456"
 *
 *     TaskStats:
 *       type: object
 *       properties:
 *         totalTasks:
 *           type: integer
 *           description: Total number of tasks
 *           example: 25
 *         statusDistribution:
 *           type: object
 *           description: Task count by status
 *           example:
 *             pending: 10
 *             in_progress: 5
 *             completed: 8
 *             cancelled: 2
 *         upcomingTasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *           description: Upcoming tasks in next 7 days
 *         completionRate:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Task completion percentage
 *           example: 68
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * security:
 *   - BearerAuth: []
 */

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task for the authenticated user. User must be verified to access this endpoint.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Email verification required
 *       500:
 *         description: Internal server error
 */
router.post('/', ...createTaskWithValidation);

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with pagination and filtering
 *     description: Retrieves a paginated list of tasks for the authenticated user with optional filtering and sorting.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter tasks by status
 *         example: "pending"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search tasks by title
 *         example: "documentation"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, createdAt, updatedAt, startTime]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: "desc"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks starting from this date
 *         example: "2024-10-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks ending before this date
 *         example: "2024-10-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tasks retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Email verification required
 *       500:
 *         description: Internal server error
 */
router.get('/', ...getTasksWithValidation);

/**
 * @openapi
 * /api/tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     description: Retrieves task statistics including status distribution, completion rate, and upcoming tasks.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task statistics retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TaskStats'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Email verification required
 *       500:
 *         description: Internal server error
 */
router.get('/stats', authMiddleware, getTaskStatsHandler);

/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a specific task by ID
 *     description: Retrieves a specific task by its ID. The task must belong to the authenticated user.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Email verification required
 *       404:
 *         description: Task not found or access denied
 *       500:
 *         description: Internal server error
 */
router.get('/:id', ...getTaskByIdWithValidation);

/**
 * @openapi
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a specific task
 *     description: Updates a specific task by its ID. The task must belong to the authenticated user.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Email verification required
 *       404:
 *         description: Task not found or access denied
 *       500:
 *         description: Internal server error
 */
router.put('/:id', ...updateTaskWithValidation);

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a specific task
 *     description: Deletes a specific task by its ID. The task must belong to the authenticated user.
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Email verification required
 *       404:
 *         description: Task not found or access denied
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', ...deleteTaskWithValidation);

export default router;
