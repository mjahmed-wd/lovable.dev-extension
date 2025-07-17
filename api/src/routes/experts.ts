import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendHireExpertEmail, sendRegisterExpertEmail, HireExpertRequest, RegisterExpertRequest } from '../services/emailService';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HireExpertRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - projectType
 *         - budget
 *         - timeline
 *         - message
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         company:
 *           type: string
 *         projectType:
 *           type: string
 *         budget:
 *           type: string
 *         timeline:
 *           type: string
 *         message:
 *           type: string
 *     RegisterExpertRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - skills
 *         - experience
 *         - bio
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: string
 *         portfolio:
 *           type: string
 *         hourlyRate:
 *           type: string
 *         bio:
 *           type: string
 */

/**
 * @swagger
 * /api/experts/hire:
 *   post:
 *     summary: Submit a hire expert request
 *     tags: [Experts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HireExpertRequest'
 *     responses:
 *       200:
 *         description: Hire request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/hire', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('projectType')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project type must be between 2 and 100 characters'),
  body('budget')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Budget must be between 2 and 50 characters'),
  body('timeline')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Timeline must be between 2 and 50 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const request: HireExpertRequest = {
      name: req.body.name,
      email: req.body.email,
      company: req.body.company,
      projectType: req.body.projectType,
      budget: req.body.budget,
      timeline: req.body.timeline,
      message: req.body.message
    };

    await sendHireExpertEmail(request);

    res.json({
      success: true,
      message: 'Your hire request has been submitted successfully. We will contact you within 24 hours.'
    });

  } catch (error) {
    console.error('Error processing hire expert request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit hire request. Please try again later.'
    });
  }
});

/**
 * @swagger
 * /api/experts/register:
 *   post:
 *     summary: Submit an expert registration
 *     tags: [Experts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterExpertRequest'
 *     responses:
 *       200:
 *         description: Expert registration submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('skills')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
  body('experience')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Experience must be between 2 and 50 characters'),
  body('portfolio')
    .optional()
    .trim()
    .isURL()
    .withMessage('Portfolio must be a valid URL'),
  body('hourlyRate')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Hourly rate cannot exceed 20 characters'),
  body('bio')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Bio must be between 50 and 2000 characters'),
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const request: RegisterExpertRequest = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      skills: req.body.skills,
      experience: req.body.experience,
      portfolio: req.body.portfolio,
      hourlyRate: req.body.hourlyRate,
      bio: req.body.bio
    };

    await sendRegisterExpertEmail(request);

    res.json({
      success: true,
      message: 'Your expert registration has been submitted successfully. We will review your application and contact you within 2-3 business days.'
    });

  } catch (error) {
    console.error('Error processing expert registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit registration. Please try again later.'
    });
  }
});

export default router; 