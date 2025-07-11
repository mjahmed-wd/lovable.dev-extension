import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
      
      // Get user from database
      const user = await User.findById(decoded.id).select('+password');
      
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Token is invalid or user is inactive'
        });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Token is invalid'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn } as any
  );
}; 