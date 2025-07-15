import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Test from '../models/Test';
import { authenticate, AuthRequest } from '../middleware/auth';
import AIService from '../services/aiService';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Test:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [unit, integration, e2e, manual]
 *         status:
 *           type: string
 *           enum: [pending, running, passed, failed, skipped]
 *         duration:
 *           type: number
 *         errorMessage:
 *           type: string
 *         testData:
 *           type: object
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         userId:
 *           type: string
 *         taskId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTestRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [unit, integration, e2e, manual]
 *         status:
 *           type: string
 *           enum: [pending, running, passed, failed, skipped]
 *         duration:
 *           type: number
 *         errorMessage:
 *           type: string
 *         testData:
 *           type: object
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         taskId:
 *           type: string
 */

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all tests for the authenticated user
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, running, passed, failed, skipped]
 *         description: Filter by test status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [unit, integration, e2e, manual]
 *         description: Filter by test type
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         description: Filter by task ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated or array)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of tests per page
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Test'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'running', 'passed', 'failed', 'skipped']).withMessage('Invalid status'),
  query('type').optional().isIn(['unit', 'integration', 'e2e', 'manual']).withMessage('Invalid type'),
  query('tags').optional().isString().withMessage('Tags must be a string (comma-separated) or array'),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId: req.user?._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.taskId) filter.taskId = req.query.taskId;
    if (req.query.tags) {
      let tags: string[] = [];
      if (Array.isArray(req.query.tags)) {
        tags = req.query.tags as string[];
      } else if (typeof req.query.tags === 'string') {
        tags = (req.query.tags as string).split(',').map(t => t.trim()).filter(Boolean);
      }
      if (tags.length > 0) {
        filter.tags = { $in: tags };
      }
    }

    // Get tests with pagination
    const [tests, total] = await Promise.all([
      Test.find(filter)
        .populate('taskId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Test.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: tests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching tests'
    });
  }
});

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTestRequest'
 *     responses:
 *       201:
 *         description: Test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name is required and must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('type')
    .isIn(['unit', 'integration', 'e2e', 'manual'])
    .withMessage('Type is required and must be valid'),
  body('status')
    .optional()
    .isIn(['pending', 'running', 'passed', 'failed', 'skipped'])
    .withMessage('Invalid status'),
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number'),
  body('errorMessage')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Error message cannot exceed 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('taskId')
    .optional()
    .isMongoId()
    .withMessage('Task ID must be a valid MongoDB ObjectId')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const testData = {
      ...req.body,
      userId: req.user?._id
    };

    const test = new Test(testData);
    await test.save();

    res.status(201).json({
      success: true,
      data: test
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while creating test'
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get a specific test by ID
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      userId: req.user?._id
    }).populate('taskId', 'title');

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching test'
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update a specific test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTestRequest'
 *     responses:
 *       200:
 *         description: Test updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('type')
    .optional()
    .isIn(['unit', 'integration', 'e2e', 'manual'])
    .withMessage('Invalid type'),
  body('status')
    .optional()
    .isIn(['pending', 'running', 'passed', 'failed', 'skipped'])
    .withMessage('Invalid status'),
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number'),
  body('errorMessage')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Error message cannot exceed 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('taskId')
    .optional()
    .isMongoId()
    .withMessage('Task ID must be a valid MongoDB ObjectId')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const test = await Test.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user?._id
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('taskId', 'title');

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating test'
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete a specific test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const test = await Test.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?._id
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting test'
    });
  }
});

/**
 * @swagger
 * /api/tests/{id}/run:
 *   post:
 *     summary: Run a specific test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test execution started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/run', async (req: AuthRequest, res) => {
  try {
    const test = await Test.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user?._id
      },
      {
        status: 'running',
        duration: undefined,
        errorMessage: undefined
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Here you would integrate with your actual test runner
    // For now, we'll just update the status

    res.json({
      success: true,
      data: test,
      message: 'Test execution started'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while running test'
    });
  }
});

/**
 * @swagger
 * /api/tests/generate-ai:
 *   post:
 *     summary: Generate test cases using AI
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - htmlContent
 *             properties:
 *               htmlContent:
 *                 type: string
 *                 description: HTML structure of the application to test
 *               projectContext:
 *                 type: string
 *                 description: Optional project context information
 *     responses:
 *       200:
 *         description: Test cases generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       steps:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             description:
 *                               type: string
 *                       expectedResult:
 *                         type: string
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high]
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: AI service error
 */
router.post('/generate-ai', [
  body('htmlContent')
    .trim()
    .isLength({ min: 10 })
    .withMessage('HTML content is required and must be at least 10 characters'),
  body('projectContext')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Project context cannot exceed 2000 characters')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { htmlContent, projectContext } = req.body;
    const geminiKey = process.env.GEMINI_KEY;

    if (!geminiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured properly'
      });
    }

    const aiService = new AIService('gemini', geminiKey);
    const generatedTestCases = await aiService.generateTestCases(htmlContent, projectContext);

    res.json({
      success: true,
      data: generatedTestCases,
      message: `Generated ${generatedTestCases.length} test cases`
    });

  } catch (error) {
    console.error('Error generating AI test cases:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Server error while generating test cases';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('overloaded') || error.message.includes('503')) {
        errorMessage = 'AI service is temporarily overloaded. Please try again in a few moments.';
        statusCode = 503;
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait before making another request.';
        statusCode = 429;
      } else if (error.message.includes('All AI models failed')) {
        errorMessage = 'All AI models are currently unavailable. Please try again later.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router; 