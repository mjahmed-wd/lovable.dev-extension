import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import AIService from '../services/aiService';
import Document from '../models/Document';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/documents/generate-ai:
 *   post:
 *     summary: Generate documentation using AI
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               htmlContent:
 *                 type: string
 *                 description: HTML content of the page
 *               conversationData:
 *                 type: object
 *                 description: Conversation data with user and AI messages
 *               documentType:
 *                 type: string
 *                 enum: [requirements, specs, guides, api, faq]
 *                 description: Type of document to generate
 *               customPrompt:
 *                 type: string
 *                 description: Custom prompt for document generation
 *               projectContext:
 *                 type: string
 *                 description: Additional project context
 *             required:
 *               - htmlContent
 *               - documentType
 *     responses:
 *       200:
 *         description: Document generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     type:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/generate-ai', [
  body('htmlContent')
    .trim()
    .isLength({ min: 10 })
    .withMessage('HTML content is required and must be at least 10 characters'),
  body('conversationData')
    .optional()
    .isObject()
    .withMessage('Conversation data must be an object'),
  body('documentType')
    .isIn(['requirements', 'specs', 'guides', 'api', 'faq'])
    .withMessage('Document type is required and must be valid'),
  body('customPrompt')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Custom prompt cannot exceed 2000 characters'),
  body('projectContext')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Project context cannot exceed 2000 characters'),
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL must be a valid URL')
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

    const { htmlContent, conversationData, documentType, customPrompt, projectContext } = req.body;
    const geminiKey = process.env.GEMINI_KEY;

    if (!geminiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured properly'
      });
    }

    const aiService = new AIService('gemini', geminiKey);
    const generatedDocument = await aiService.generateDocument(
      htmlContent,
      conversationData,
      documentType,
      customPrompt,
      projectContext
    );

    // Save document to database
    const document = new Document({
      title: generatedDocument.title,
      content: generatedDocument.content,
      documentType: documentType === 'requirements' ? 'requirement' : 
                   documentType === 'specs' ? 'specification' : 
                   documentType === 'guides' ? 'documentation' :
                   documentType === 'api' ? 'documentation' : 'other',
      customPrompt,
      url: req.body.url,
      htmlContent,
      conversationData,
      userId: req.user!._id
    });

    const savedDocument = await document.save();

    res.json({
      success: true,
      data: {
        ...generatedDocument,
        documentId: savedDocument._id,
        createdAt: savedDocument.createdAt
      },
      message: `Generated ${documentType} document successfully`
    });

  } catch (error) {
    console.error('Error generating AI document:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error while generating document'
    });
  }
});

// Helper function to convert markdown to DOCX paragraphs
const convertMarkdownToDocxParagraphs = (markdownContent: string): any[] => {
  return markdownContent.split('\n').map(line => {
    if (line.trim() === '') {
      return new Paragraph({ text: '' });
    }
    
    // Handle headings
    if (line.startsWith('# ')) {
      return new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1,
      });
    } else if (line.startsWith('## ')) {
      return new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2,
      });
    } else if (line.startsWith('### ')) {
      return new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3,
      });
    }
    
    // Handle bold text **text**
    if (line.includes('**')) {
      const parts = line.split('**');
      const runs = parts.map((part, index) => 
        new TextRun({
          text: part,
          bold: index % 2 === 1
        })
      );
      return new Paragraph({ children: runs });
    }
    
    // Regular paragraph
    return new Paragraph({ text: line });
  });
};

/**
 * @swagger
 * /api/documents/{id}/docx:
 *   get:
 *     summary: Generate and download DOCX file for a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: DOCX file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id/docx', async (req: AuthRequest, res) => {
  try {
    const documentId = req.params.id;
    
    // Find document in database
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user!._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Prepare markdown content with document metadata
    let markdownContent = `# ${document.title}\n\n${document.content}`;
    
    // Add metadata section if available
    if (document.conversationData || document.htmlContent || document.url) {
      markdownContent += '\n\n---\n\n## Document Metadata\n\n';
      
      if (document.url) {
        markdownContent += `**Source URL:** ${document.url}\n\n`;
      }
      
      if (document.conversationData && document.conversationData.mergedMessages && document.conversationData.mergedMessages.length > 0) {
        markdownContent += `**Conversation Summary:** ${document.conversationData.mergedMessages.length} messages captured from conversation\n\n`;
      }
      
      markdownContent += `**Generated:** ${new Date(document.createdAt).toLocaleString()}\n\n`;
    }

    // Convert markdown to DOCX using docx library
    const paragraphs = convertMarkdownToDocxParagraphs(markdownContent);

    const docxDocument = new DocxDocument({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(docxDocument);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title}.docx"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the buffer
    res.send(buffer);

  } catch (error) {
    console.error('Error generating DOCX:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error while generating DOCX'
    });
  }
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get user's documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
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
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const documents = await Document.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .select('-htmlContent -conversationData'); // Exclude large fields for list view

    res.json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error while fetching documents'
    });
  }
});

export default router; 