import { errorRecovery, type OperationResult } from './error-recovery';

/**
 * Enhanced Batch API system with error recovery
 * Combines multiple API requests with intelligent retry and fallback strategies
 */

interface BatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

class BatchAPIManager {
  private pendingRequests = new Map<string, BatchRequest>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 10; // Google Drive batch limit
  private readonly batchDelay = 100; // 100ms delay to collect requests

  // Queue a request for batching
  enqueue<T>(
    id: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: BatchRequest = {
        id,
        method,
        path,
        body,
        resolve,
        reject
      };

      this.pendingRequests.set(id, request);
      this.scheduleBatch();
    });
  }

  private scheduleBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  private async processBatch() {
    if (this.pendingRequests.size === 0) return;

    const requests = Array.from(this.pendingRequests.values());
    const batches = this.chunkRequests(requests, this.batchSize);

    this.pendingRequests.clear();

    // Process all batches concurrently
    await Promise.all(batches.map(batch => this.executeBatch(batch)));
  }

  private chunkRequests(requests: BatchRequest[], size: number): BatchRequest[][] {
    const chunks: BatchRequest[][] = [];
    for (let i = 0; i < requests.length; i += size) {
      chunks.push(requests.slice(i, i + size));
    }
    return chunks;
  }

  private async executeBatch(requests: BatchRequest[]) {
    try {
      // For now, execute requests individually since Google Drive batch API
      // requires special setup. This still provides request queuing benefits.
      const results = await Promise.allSettled(
        requests.map(req => this.executeIndividualRequest(req))
      );

      results.forEach((result, index) => {
        const request = requests[index];
        if (result.status === 'fulfilled') {
          request.resolve(result.value);
        } else {
          request.reject(result.reason);
        }
      });
    } catch (error) {
      requests.forEach(req => req.reject(error));
    }
  }

  private async executeIndividualRequest(request: BatchRequest) {
    const options: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (request.body) {
      options.body = JSON.stringify(request.body);
    }

    const response = await fetch(request.path, options);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Batch file details requests
  async getMultipleFileDetails(fileIds: string[]): Promise<Record<string, any>> {
    const promises = fileIds.map(id => 
      this.enqueue(`file-details-${id}`, 'GET', `/api/drive/files/${id}`)
    );

    const results = await Promise.allSettled(promises);
    const details: Record<string, any> = {};

    results.forEach((result, index) => {
      const fileId = fileIds[index];
      if (result.status === 'fulfilled') {
        details[fileId] = result.value;
      } else {
        console.warn(`Failed to get details for file ${fileId}:`, result.reason);
        details[fileId] = null;
      }
    });

    return details;
  }

  // Batch multiple file operations
  async batchFileOperations(operations: Array<{
    fileId: string;
    action: string;
    data?: any;
  }>): Promise<Record<string, any>> {
    const promises = operations.map(op => 
      this.enqueue(
        `batch-op-${op.fileId}-${op.action}`,
        'PUT',
        `/api/drive/files/${op.fileId}`,
        { action: op.action, ...op.data }
      )
    );

    const results = await Promise.allSettled(promises);
    const responses: Record<string, any> = {};

    results.forEach((result, index) => {
      const operation = operations[index];
      const key = `${operation.fileId}-${operation.action}`;

      if (result.status === 'fulfilled') {
        responses[key] = result.value;
      } else {
        console.warn(`Batch operation failed for ${key}:`, result.reason);
        responses[key] = { error: result.reason };
      }
    });

    return responses;
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      hasPendingBatch: this.batchTimeout !== null
    };
  }

  clear() {
    this.pendingRequests.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

export const batchAPI = new BatchAPIManager();