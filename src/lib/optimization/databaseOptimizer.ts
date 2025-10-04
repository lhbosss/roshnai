import mongoose from 'mongoose';
import Book from '../../models/Book';
import User from '../../models/User';
import Transaction from '../../models/Transaction';
import Message from '../../models/Message';

/**
 * Database Query Optimization Module
 * 
 * This module provides optimized query patterns, indexing strategies,
 * and performance monitoring for MongoDB operations.
 */

export class DatabaseOptimizer {
  /**
   * Create optimized indexes for all collections
   */
  static async createOptimizedIndexes() {
    try {
      console.log('Creating optimized database indexes...');

      // Books Collection Indexes
      await Book.collection.createIndex({ 
        title: 'text', 
        author: 'text', 
        description: 'text' 
      }, { 
        name: 'book_text_search',
        weights: { title: 10, author: 5, description: 1 }
      });

      await Book.collection.createIndex({ owner: 1 }, { name: 'book_owner' });
      await Book.collection.createIndex({ available: 1 }, { name: 'book_availability' });
      await Book.collection.createIndex({ condition: 1 }, { name: 'book_condition' });
      await Book.collection.createIndex({ price: 1 }, { name: 'book_price' });
      await Book.collection.createIndex({ isbn: 1 }, { 
        name: 'book_isbn', 
        unique: true, 
        sparse: true 
      });
      await Book.collection.createIndex({ 
        available: 1, 
        condition: 1, 
        price: 1 
      }, { name: 'book_search_composite' });

      // Users Collection Indexes
      await User.collection.createIndex({ email: 1 }, { 
        name: 'user_email', 
        unique: true 
      });
      await User.collection.createIndex({ role: 1 }, { name: 'user_role' });
      await User.collection.createIndex({ createdAt: 1 }, { name: 'user_created' });
      await User.collection.createIndex({ lastLogin: 1 }, { 
        name: 'user_last_login',
        sparse: true 
      });

      // Transactions Collection Indexes
      await Transaction.collection.createIndex({ borrower: 1 }, { name: 'transaction_borrower' });
      await Transaction.collection.createIndex({ lender: 1 }, { name: 'transaction_lender' });
      await Transaction.collection.createIndex({ book: 1 }, { name: 'transaction_book' });
      await Transaction.collection.createIndex({ status: 1 }, { name: 'transaction_status' });
      await Transaction.collection.createIndex({ createdAt: 1 }, { name: 'transaction_created' });
      await Transaction.collection.createIndex({ 
        borrower: 1, 
        status: 1, 
        createdAt: -1 
      }, { name: 'transaction_borrower_composite' });
      await Transaction.collection.createIndex({ 
        lender: 1, 
        status: 1, 
        createdAt: -1 
      }, { name: 'transaction_lender_composite' });

      // Messages Collection Indexes
      await Message.collection.createIndex({ sender: 1 }, { name: 'message_sender' });
      await Message.collection.createIndex({ recipient: 1 }, { name: 'message_recipient' });
      await Message.collection.createIndex({ transaction: 1 }, { 
        name: 'message_transaction',
        sparse: true 
      });
      await Message.collection.createIndex({ createdAt: 1 }, { name: 'message_created' });
      await Message.collection.createIndex({ isRead: 1 }, { name: 'message_read_status' });
      await Message.collection.createIndex({ 
        recipient: 1, 
        isRead: 1, 
        createdAt: -1 
      }, { name: 'message_recipient_composite' });

      console.log('✓ Database indexes created successfully');
    } catch (error) {
      console.error('Error creating database indexes:', error);
      throw error;
    }
  }

  /**
   * Optimized book search with aggregation pipeline
   */
  static async optimizedBookSearch(searchParams: {
    query?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    owner?: string;
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      query,
      condition,
      minPrice,
      maxPrice,
      owner,
      limit = 20,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = searchParams;

    const pipeline: any[] = [
      // Match stage - filter documents
      {
        $match: {
          available: true,
          ...(query && {
            $text: { $search: query }
          }),
          ...(condition && { condition }),
          ...(minPrice !== undefined || maxPrice !== undefined) && {
            price: {
              ...(minPrice !== undefined && { $gte: minPrice }),
              ...(maxPrice !== undefined && { $lte: maxPrice })
            }
          },
          ...(owner && { owner: new mongoose.Types.ObjectId(owner) })
        }
      }
    ];

    // Add text search score if text search is used
    if (query) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // Lookup owner information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerInfo',
        pipeline: [
          { $project: { name: 1, email: 1, avatar: 1 } }
        ]
      }
    });

    pipeline.push({
      $unwind: '$ownerInfo'
    });

    // Sort stage
    const sortStage: any = {};
    if (query) {
      sortStage.score = { $meta: 'textScore' };
    }
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    pipeline.push({ $sort: sortStage });

    // Facet stage for pagination and count
    pipeline.push({
      $facet: {
        books: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    });

    const result = await Book.aggregate(pipeline);
    
    return {
      books: result[0]?.books || [],
      totalCount: result[0]?.totalCount[0]?.count || 0,
      hasMore: (result[0]?.totalCount[0]?.count || 0) > skip + limit
    };
  }

  /**
   * Optimized user transaction history
   */
  static async getUserTransactionHistory(userId: string, options: {
    limit?: number;
    skip?: number;
    status?: string;
    role?: 'borrower' | 'lender';
  } = {}) {
    const { limit = 20, skip = 0, status, role } = options;

    const matchStage: any = {};
    
    if (role === 'borrower') {
      matchStage.borrower = new mongoose.Types.ObjectId(userId);
    } else if (role === 'lender') {
      matchStage.lender = new mongoose.Types.ObjectId(userId);
    } else {
      matchStage.$or = [
        { borrower: new mongoose.Types.ObjectId(userId) },
        { lender: new mongoose.Types.ObjectId(userId) }
      ];
    }

    if (status) {
      matchStage.status = status;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'bookInfo',
          pipeline: [
            { $project: { title: 1, author: 1, image: 1, condition: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'borrower',
          foreignField: '_id',
          as: 'borrowerInfo',
          pipeline: [
            { $project: { name: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lender',
          foreignField: '_id',
          as: 'lenderInfo',
          pipeline: [
            { $project: { name: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      {
        $unwind: {
          path: '$bookInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$borrowerInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$lenderInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          transactions: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await Transaction.aggregate(pipeline);
    
    return {
      transactions: result[0]?.transactions || [],
      totalCount: result[0]?.totalCount[0]?.count || 0
    };
  }

  /**
   * Optimized message retrieval with conversation threading
   */
  static async getConversationMessages(conversationParams: {
    userId: string;
    otherUserId?: string;
    transactionId?: string;
    limit?: number;
    before?: Date;
  }) {
    const { userId, otherUserId, transactionId, limit = 50, before } = conversationParams;

    const matchStage: any = {};

    if (transactionId) {
      matchStage.transaction = new mongoose.Types.ObjectId(transactionId);
    } else if (otherUserId) {
      matchStage.$or = [
        {
          sender: new mongoose.Types.ObjectId(userId),
          recipient: new mongoose.Types.ObjectId(otherUserId)
        },
        {
          sender: new mongoose.Types.ObjectId(otherUserId),
          recipient: new mongoose.Types.ObjectId(userId)
        }
      ];
    } else {
      matchStage.$or = [
        { sender: new mongoose.Types.ObjectId(userId) },
        { recipient: new mongoose.Types.ObjectId(userId) }
      ];
    }

    if (before) {
      matchStage.createdAt = { $lt: before };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderInfo',
          pipeline: [
            { $project: { name: 1, avatar: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipientInfo',
          pipeline: [
            { $project: { name: 1, avatar: 1 } }
          ]
        }
      },
      {
        $unwind: '$senderInfo'
      },
      {
        $unwind: '$recipientInfo'
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit }
    ];

    return await Message.aggregate(pipeline);
  }

  /**
   * Database performance analytics
   */
  static async getPerformanceAnalytics() {
    try {
      const db = mongoose.connection.db;
      
      // Get collection stats
      const collections = ['books', 'users', 'transactions', 'messages'];
      const stats: any = {};

      for (const collectionName of collections) {
        const collectionStats = await db.collection(collectionName).stats();
        stats[collectionName] = {
          documentCount: collectionStats.count,
          avgDocumentSize: collectionStats.avgObjSize,
          totalSize: collectionStats.size,
          indexSize: collectionStats.totalIndexSize,
          indexes: collectionStats.nindexes
        };
      }

      // Get slow query stats (if profiling is enabled)
      const slowQueries = await db.collection('system.profile').find({
        ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        millis: { $gte: 100 } // Queries taking more than 100ms
      }).sort({ ts: -1 }).limit(10).toArray();

      return {
        collections: stats,
        slowQueries,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      return null;
    }
  }

  /**
   * Enable MongoDB profiling for performance monitoring
   */
  static async enableProfiling(slowOpThreshold = 100) {
    try {
      const db = mongoose.connection.db;
      await db.admin().command({
        profile: 2, // Profile all operations
        slowms: slowOpThreshold
      });
      console.log(`✓ MongoDB profiling enabled (threshold: ${slowOpThreshold}ms)`);
    } catch (error) {
      console.error('Error enabling MongoDB profiling:', error);
    }
  }

  /**
   * Disable MongoDB profiling
   */
  static async disableProfiling() {
    try {
      const db = mongoose.connection.db;
      await db.admin().command({ profile: 0 });
      console.log('✓ MongoDB profiling disabled');
    } catch (error) {
      console.error('Error disabling MongoDB profiling:', error);
    }
  }

  /**
   * Clean up old data and optimize collections
   */
  static async performMaintenance() {
    try {
      console.log('Starting database maintenance...');

      // Clean up old expired sessions
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Remove old read messages (optional)
      const oldMessagesResult = await Message.deleteMany({
        isRead: true,
        createdAt: { $lt: cutoffDate }
      });

      // Remove old completed transactions (archive instead of delete in production)
      const completedTransactionsResult = await Transaction.updateMany(
        {
          status: 'completed',
          updatedAt: { $lt: cutoffDate }
        },
        {
          $set: { archived: true }
        }
      );

      console.log('✓ Database maintenance completed');
      console.log(`  - Removed ${oldMessagesResult.deletedCount} old messages`);
      console.log(`  - Archived ${completedTransactionsResult.modifiedCount} old transactions`);
    } catch (error) {
      console.error('Error during database maintenance:', error);
    }
  }

  /**
   * Analyze and suggest query optimizations
   */
  static async analyzeQueries() {
    try {
      const db = mongoose.connection.db;
      
      // Get index usage stats
      const collections = ['books', 'users', 'transactions', 'messages'];
      const analysis: any = {};

      for (const collectionName of collections) {
        const indexStats = await db.collection(collectionName).aggregate([
          { $indexStats: {} }
        ]).toArray();

        const unusedIndexes = indexStats.filter((index: any) => 
          index.accesses.ops === 0 && index.name !== '_id_'
        );

        const mostUsedIndexes = indexStats
          .filter((index: any) => index.name !== '_id_')
          .sort((a: any, b: any) => b.accesses.ops - a.accesses.ops)
          .slice(0, 5);

        analysis[collectionName] = {
          totalIndexes: indexStats.length,
          unusedIndexes: unusedIndexes.map((idx: any) => idx.name),
          mostUsedIndexes: mostUsedIndexes.map((idx: any) => ({
            name: idx.name,
            operations: idx.accesses.ops,
            since: idx.accesses.since
          }))
        };
      }

      return {
        analysis,
        recommendations: this.generateOptimizationRecommendations(analysis),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing queries:', error);
      return null;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private static generateOptimizationRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    Object.keys(analysis).forEach(collection => {
      const stats = analysis[collection];
      
      if (stats.unusedIndexes.length > 0) {
        recommendations.push(
          `Consider removing unused indexes in ${collection}: ${stats.unusedIndexes.join(', ')}`
        );
      }

      if (stats.mostUsedIndexes.length === 0) {
        recommendations.push(
          `Collection ${collection} may need performance optimization - no heavily used indexes found`
        );
      }
    });

    return recommendations;
  }
}

export default DatabaseOptimizer;