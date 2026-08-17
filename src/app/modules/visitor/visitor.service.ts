// services/visitor.service.ts
import prisma from "../../../config/db.prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  parseISO,
  isValid
} from 'date-fns';

// Track a new visitor
export const trackVisitor = async (data: {
  sessionId: string;
  userId?: string;
}) => {
  const { sessionId, userId } = data;

  // Check if visitor already exists in last 24 hours (prevent duplicate tracking)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const existingVisitor = await prisma.visitor.findFirst({
    where: {
      sessionId,
      createdAt: {
        gte: twentyFourHoursAgo
      }
    }
  });

  // If visitor already tracked in last 24 hours, don't create duplicate
  if (existingVisitor) {
    return existingVisitor;
  }

  // Create new visitor record
  return await prisma.visitor.create({
    data: {
      sessionId,
      ...(userId && { userId }),
      createdAt: new Date()
    }
  });
};

// Get total visitors by date range
export const getTotalVisitors = async (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  const { startDate, endDate } = params || {};

  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    // Use provided dates
    const parsedStart = parseISO(startDate);
    const parsedEnd = parseISO(endDate);

    if (isValid(parsedStart) && isValid(parsedEnd)) {
      start = startOfDay(parsedStart);
      end = endOfDay(parsedEnd);
    } else {
      // Fallback to current month if invalid dates
      const now = new Date();
      start = startOfMonth(now);
      end = endOfMonth(now);
    }
  } else {
    // Default to current month
    const now = new Date();
    start = startOfMonth(now);
    end = endOfMonth(now);
  }

  // Count visitors in date range
  const count = await prisma.visitor.count({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    }
  });

  return {
    totalVisitors: count,
    period: {
      start,
      end
    }
  };
};
export const VisitorService = {
  trackVisitor,
  getTotalVisitors
};