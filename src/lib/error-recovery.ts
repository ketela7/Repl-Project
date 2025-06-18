
/**
 * Error Recovery System for Google Drive Management
 * Provides retry mechanisms, fallback strategies, and error tracking
 */

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

interface ErrorRecoveryOptions {
  operation: string;
  retryConfig?: Partial<RetryConfig>;
  fallbackStrategy?: () => Promise<any>;
  onRetry?: (attempt: number, error: Error) => void;
  onFallback?: (error: Error) => void;
}

interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  usedFallback: boolean;
  recoveryPath?: string;
}

class ErrorRecoveryManager {
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'network',
      'timeout',
      'rate_limit',
      'temporary',
      '429', // Too Many Requests
      '503', // Service Unavailable
      '502', // Bad Gateway
      '500', // Internal Server Error (sometimes retryable)
    ]
  };

  private errorStats = new Map<string, {
    totalAttempts: number;
    successfulRetries: number;
    fallbackUsed: number;
    commonErrors: Map<string, number>;
  }>();

  /**
   * Execute operation with error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    options: ErrorRecoveryOptions
  ): Promise<OperationResult<T>> {
    const config = { ...this.defaultRetryConfig, ...options.retryConfig };
    let lastError: Error | null = null;
    let attempts = 0;

    // Initialize stats tracking
    this.initializeStats(options.operation);

    // Main retry loop
    for (attempts = 1; attempts <= config.maxRetries + 1; attempts++) {
      try {
        const result = await operation();
        
        // Success - update stats and return
        if (attempts > 1) {
          this.updateStats(options.operation, 'retry_success');
        }
        
        return {
          success: true,
          data: result,
          attempts,
          usedFallback: false,
          recoveryPath: attempts > 1 ? 'retry' : 'direct'
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.updateStats(options.operation, 'error', lastError.message);

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config) || attempts > config.maxRetries) {
          break;
        }

        // Call retry callback
        if (options.onRetry) {
          options.onRetry(attempts, lastError);
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempts - 1),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        console.log(`Retry attempt ${attempts} for ${options.operation} after ${jitteredDelay}ms delay`);
        await this.sleep(jitteredDelay);
      }
    }

    // All retries failed - try fallback strategy
    if (options.fallbackStrategy) {
      try {
        console.log(`Attempting fallback strategy for ${options.operation}`);
        if (options.onFallback && lastError) {
          options.onFallback(lastError);
        }

        const fallbackResult = await options.fallbackStrategy();
        this.updateStats(options.operation, 'fallback_success');

        return {
          success: true,
          data: fallbackResult,
          attempts,
          usedFallback: true,
          recoveryPath: 'fallback'
        };
      } catch (fallbackError) {
        console.error(`Fallback strategy failed for ${options.operation}:`, fallbackError);
        this.updateStats(options.operation, 'fallback_failed');
      }
    }

    // Complete failure
    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts,
      usedFallback: false,
      recoveryPath: 'failed'
    };
  }

  /**
   * Bulk operation with individual item recovery
   */
  async executeBulkWithRecovery<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: ErrorRecoveryOptions & {
      continueOnError?: boolean;
      batchSize?: number;
      progressCallback?: (completed: number, total: number, results: OperationResult<R>[]) => void;
    }
  ): Promise<{
    results: OperationResult<R>[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      retriedItems: number;
      fallbackUsed: number;
    };
  }> {
    const { continueOnError = true, batchSize = 5, progressCallback } = options;
    const results: OperationResult<R>[] = [];
    let completed = 0;

    // Process items in batches to prevent overwhelming the API
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item, index) => {
        const itemOperation = () => operation(item);
        const itemOptions = {
          ...options,
          operation: `${options.operation}-item-${i + index}`
        };

        const result = await this.executeWithRecovery(itemOperation, itemOptions);
        
        completed++;
        if (progressCallback) {
          progressCallback(completed, items.length, [...results, result]);
        }

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Check if we should continue after batch failures
      if (!continueOnError && batchResults.some(r => !r.success)) {
        console.log(`Stopping bulk operation ${options.operation} due to batch failures`);
        break;
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < items.length) {
        await this.sleep(300); // 300ms between batches
      }
    }

    // Calculate summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      retriedItems: results.filter(r => r.attempts > 1).length,
      fallbackUsed: results.filter(r => r.usedFallback).length
    };

    return { results, summary };
  }

  /**
   * Specific recovery strategies for common Google Drive operations
   */
  createDriveOperationStrategies() {
    return {
      // File download with stream fallback
      fileDownload: (fileId: string, fileName: string) => ({
        operation: 'file_download',
        retryConfig: {
          maxRetries: 3,
          baseDelay: 2000,
          retryableErrors: [...this.defaultRetryConfig.retryableErrors, 'stream_error']
        },
        fallbackStrategy: async () => {
          // Fallback to direct link download if streaming fails
          console.log(`Using direct link fallback for file ${fileId}`);
          const response = await fetch(`/api/drive/download/${fileId}?direct=true`);
          if (!response.ok) throw new Error('Direct download fallback failed');
          return response.blob();
        }
      }),

      // File export with format fallback
      fileExport: (fileId: string, preferredFormat: string) => ({
        operation: 'file_export',
        retryConfig: {
          maxRetries: 2,
          baseDelay: 3000
        },
        fallbackStrategy: async () => {
          // Fallback to PDF if preferred format fails
          if (preferredFormat !== 'pdf') {
            console.log(`Using PDF fallback for export ${fileId}`);
            const response = await fetch(`/api/drive/files/${fileId}/export?format=pdf`);
            if (!response.ok) throw new Error('PDF export fallback failed');
            return response.blob();
          }
          throw new Error('No fallback available for PDF export');
        }
      }),

      // File rename with timestamp fallback
      fileRename: (fileId: string, newName: string) => ({
        operation: 'file_rename',
        fallbackStrategy: async () => {
          // Add timestamp if name conflict
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const fallbackName = `${newName} (${timestamp})`;
          console.log(`Using timestamped name fallback: ${fallbackName}`);
          
          const response = await fetch(`/api/drive/files/${fileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rename', name: fallbackName })
          });
          
          if (!response.ok) throw new Error('Rename fallback failed');
          return response.json();
        }
      }),

      // File move with root fallback
      fileMove: (fileId: string, targetFolderId: string) => ({
        operation: 'file_move',
        fallbackStrategy: async () => {
          // Move to root if target folder is inaccessible
          console.log(`Moving file ${fileId} to root folder as fallback`);
          
          const response = await fetch(`/api/drive/files/${fileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'move', parentId: null })
          });
          
          if (!response.ok) throw new Error('Move to root fallback failed');
          return response.json();
        }
      })
    };
  }

  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    return config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeStats(operation: string): void {
    if (!this.errorStats.has(operation)) {
      this.errorStats.set(operation, {
        totalAttempts: 0,
        successfulRetries: 0,
        fallbackUsed: 0,
        commonErrors: new Map()
      });
    }
  }

  private updateStats(operation: string, type: string, errorMessage?: string): void {
    const stats = this.errorStats.get(operation);
    if (!stats) return;

    stats.totalAttempts++;

    switch (type) {
      case 'retry_success':
        stats.successfulRetries++;
        break;
      case 'fallback_success':
        stats.fallbackUsed++;
        break;
      case 'error':
        if (errorMessage) {
          const count = stats.commonErrors.get(errorMessage) || 0;
          stats.commonErrors.set(errorMessage, count + 1);
        }
        break;
    }
  }

  getErrorStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.errorStats.forEach((value, key) => {
      stats[key] = {
        ...value,
        commonErrors: Object.fromEntries(value.commonErrors)
      };
    });

    return stats;
  }

  clearStats(): void {
    this.errorStats.clear();
  }
}

// Export singleton instance
export const errorRecovery = new ErrorRecoveryManager();

// Export types for use in other modules
export type { OperationResult, ErrorRecoveryOptions, RetryConfig };
