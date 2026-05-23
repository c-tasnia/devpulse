import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { queryOne } from '../../utils/db.utils';
import { signToken } from '../../utils/jwt.utils';
import { sendSuccess, sendError } from '../../utils/response.utils';
import { SignupBody, LoginBody, User, PublicUser } from '../../types';

const SALT_ROUNDS = 10;


 //Register a new user account.

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, role = 'contributor' }: SignupBody = req.body;

    //Input validation

    if (!name || !email || !password) {
      sendError({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'name, email, and password are required.',
      });
      return;
    }

    if (!['contributor', 'maintainer'].includes(role)) {
      sendError({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'role must be contributor or maintainer.',
      });
      return;
    }

    // Duplicate email check 

    const existing = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing) {
      sendError({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'An account with this email already exists.',
      });
      return;
    }

    // Hash password & insert 

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await queryOne<PublicUser>(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashed, role]
    );

    sendSuccess({
      res,
      statusCode: StatusCodes.CREATED,
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
}

//Authenticate user and return signed JWT
 
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password }: LoginBody = req.body;

    if (!email || !password) {
      sendError({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'email and password are required.',
      });
      return;
    }

    // Fetch user

    const user = await queryOne<User>(
      'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      sendError({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Invalid email or password.',
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      sendError({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Invalid email or password.',
      });
      return;
    }

    //Sign JWT with id, name, role 

    const token = signToken({ id: user.id, name: user.name, role: user.role });

    sendSuccess({
      res,
      statusCode: StatusCodes.OK,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
